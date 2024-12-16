// Silence TS error for window._testResult and window._isolatedTestResults
declare global {
    interface Window {
        _testResult?: string;
        _isolatedTestResults?: any;
    }
}

import fs from "fs";
import path from "path";
import { test, expect, BrowserContext, Page, Worker } from "@playwright/test";
import { chromium } from "playwright";

const extensionPath = path.join(__dirname, "../../webext/chrome");
const testUrl = "https://example.com";

let context: BrowserContext;
let extensionId: string;
let page: Page;
let settingsPage: Page;
let serviceWorker: Worker;

async function loadWorkbench() {
    const scriptPath = path.join(__dirname, "../../webext/chrome/playwright/harness/testWorkbench.js");
    const scriptContent = fs.readFileSync(scriptPath, "utf8");
    await page.evaluate(scriptContent);
    await settingsPage.evaluate(scriptContent);
    await serviceWorker.evaluate(scriptContent);
}

// Test persistence operations for MessagingProvider and IndexedDBProvider in all relevant extension and web contexts.
test.describe("Persistence messaging verification in all contexts", () => {
    test.beforeAll(async () => {
        context = await chromium.launchPersistentContext("", {
            headless: false,
            args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
        });
        [serviceWorker] = context.serviceWorkers();
        if (!serviceWorker) {
            serviceWorker = await context.waitForEvent("serviceworker");
        }
        extensionId = serviceWorker.url().split("/")[2];
    });

    test.beforeEach(async () => {
        page = await context.newPage();
        await page.goto(testUrl);
        await page.waitForLoadState("networkidle");

        settingsPage = await context.newPage();
        await settingsPage.goto(`chrome-extension://${extensionId}/settings.html`);
        await loadWorkbench();
    });

    test.afterEach(async () => {
        await page.close();
        await settingsPage.close();
    });

    test.afterAll(async () => {
        await context.close();
    });

    // --- MessagingProvider: main world context ---
    test("via MessagingProvider: Add, list, get, update, delete in main world", async () => {
        // Add entry from main world using MessagingProvider
        const uuid = await page.evaluate(async () => {
            return await globalThis._communicator.testMessagingProvider.add({ data: "main-entry" });
        });
        expect(uuid).toBeTruthy();

        // List entries from main world using MessagingProvider
        const listMain = await page.evaluate(async () => {
            return await globalThis._communicator.testMessagingProvider.list();
        });
        expect(Array.isArray(listMain)).toBe(true);
        expect(listMain.some((e) => e.uuid === uuid)).toBe(true);

        // Get entry from main world using MessagingProvider
        const gotMain = await page.evaluate(async (id) => {
            return await globalThis._communicator.testMessagingProvider.get(id);
        }, uuid);
        expect(gotMain?.uuid).toBe(uuid);
        expect(gotMain?.data).toBe("main-entry");

        // Update entry from main world using MessagingProvider
        const updatedUuid = await page.evaluate(async (id) => {
            return await globalThis._communicator.testMessagingProvider.update({ uuid: id, data: "main-updated" });
        }, uuid);
        expect(updatedUuid).toBe(uuid);

        // Get entry after update from main world using MessagingProvider
        const gotUpdated = await page.evaluate(async (id) => {
            return await globalThis._communicator.testMessagingProvider.get(id);
        }, uuid);
        expect(gotUpdated?.data).toBe("main-updated");

        // Delete entry from main world using MessagingProvider
        const deletedUuid = await page.evaluate(async (id) => {
            return await globalThis._communicator.testMessagingProvider.delete(id);
        }, uuid);
        expect(deletedUuid).toBe(uuid);

        // List entries after delete from main world using MessagingProvider
        const listAfterDelete = await page.evaluate(async () => {
            return await globalThis._communicator.testMessagingProvider.list();
        });
        expect(listAfterDelete.some((e) => e.uuid === uuid)).toBe(false);

        // Uncomment for interactive debugging:
        // test.setTimeout(0);
        // await page.pause();
    });

    // --- MessagingProvider: isolated world context (script injected from background) ---
    test("via MessagingProvider: Add, list, get, update, delete in isolated world", async () => {
        // Use the background context to inject a script into the ISOLATED world of the test tab.
        // The script will run MessagingProvider operations and send results to the main world via postMessage.
        // Get the real Chrome tab ID for the test page.
        const testPageUrl = page.url();
        const tabId = await serviceWorker.evaluate(async (testPageUrl) => {
            const tabs = await chrome.tabs.query({ url: testPageUrl });
            if (!tabs.length) throw new Error("No tab found for test page URL: " + testPageUrl);
            const id = tabs[0].id;
            if (typeof id !== "number") throw new Error("Tab id is undefined for test page URL: " + testPageUrl);
            return id;
        }, testPageUrl);
        // Listen for results from isolated world via postMessage in the main world
        const resultsPromise = page.evaluate(() => {
            return new Promise<any>((resolve) => {
                function handler(event: MessageEvent) {
                    if (event.data && event.data.type === "isolatedTestResults") {
                        window.removeEventListener("message", handler);
                        resolve(event.data.results);
                    }
                }
                window.addEventListener("message", handler);
            });
        });
        // Inject script into ISOLATED world from background context
        await serviceWorker.evaluate(async (tabId) => {
            await chrome.scripting.executeScript({
                target: { tabId, allFrames: false },
                func: () => {
                    (async () => {
                        const results: any = {};
                        const provider = globalThis._communicator.testMessagingProvider;
                        results.uuid = await provider.add({ data: "isolated-entry" });
                        results.list = await provider.list();
                        results.got = await provider.get(results.uuid);
                        results.updatedUuid = await provider.update({ uuid: results.uuid, data: "isolated-updated" });
                        results.gotUpdated = await provider.get(results.uuid);
                        results.deletedUuid = await provider.delete(results.uuid);
                        results.listAfterDelete = await provider.list();
                        window.postMessage({ type: "isolatedTestResults", results }, "*");
                    })();
                },
                world: "ISOLATED",
            });
        }, tabId);
        // Wait for results from main world (received via postMessage)
        const results = await resultsPromise;
        expect(results.uuid).toBeTruthy();
        expect(Array.isArray(results.list)).toBe(true);
        expect(results.list.some((e: any) => e.uuid === results.uuid)).toBe(true);
        expect(results.got?.uuid).toBe(results.uuid);
        expect(results.got?.data).toBe("isolated-entry");
        expect(results.updatedUuid).toBe(results.uuid);
        expect(results.gotUpdated?.data).toBe("isolated-updated");
        expect(results.deletedUuid).toBe(results.uuid);
        expect(results.listAfterDelete.some((e: any) => e.uuid === results.uuid)).toBe(false);

        // Uncomment for interactive debugging:
        // test.setTimeout(0);
        // await page.pause();
    });

    // --- IndexedDBProvider: background and extension page contexts ---
    test("via IndexedDBProvider: Add, list, get, update, delete in background + extension page", async () => {
        // Add entry from background (service worker) using IndexedDBProvider
        const uuid = await serviceWorker.evaluate(async () => {
            return await globalThis._communicator.testIdbProvider.add({ data: "bg-entry" });
        });
        expect(uuid).toBeTruthy();

        // List entries from extension page (settingsPage) using IndexedDBProvider
        const listExt = await settingsPage.evaluate(() => {
            const provider = globalThis._communicator?.testIdbProvider;
            if (!provider) throw new Error("testIdbProvider is not available in extension page context");
            return provider.list();
        });
        expect(Array.isArray(listExt)).toBe(true);
        expect((listExt as any[]).some((e) => e.uuid === uuid)).toBe(true);

        // Get entry from background using IndexedDBProvider
        const gotBg = await serviceWorker.evaluate(async (id) => {
            return await globalThis._communicator.testIdbProvider.get(id);
        }, uuid);
        expect(gotBg?.uuid).toBe(uuid);
        expect(gotBg?.data).toBe("bg-entry");

        // Update entry from extension page using IndexedDBProvider
        const updatedUuid = await settingsPage.evaluate(async (id) => {
            return await globalThis._communicator.testIdbProvider.update({ uuid: id, data: "ext-updated" });
        }, uuid);
        expect(updatedUuid).toBe(uuid);

        // Get entry after update from background using IndexedDBProvider
        const gotUpdated = await serviceWorker.evaluate(async (id) => {
            return await globalThis._communicator.testIdbProvider.get(id);
        }, uuid);
        expect(gotUpdated?.data).toBe("ext-updated");

        // Delete entry from background using IndexedDBProvider
        const deletedUuid = await serviceWorker.evaluate(async (id) => {
            return await globalThis._communicator.testIdbProvider.delete(id);
        }, uuid);
        expect(deletedUuid).toBe(uuid);

        // List entries after delete from extension page using IndexedDBProvider
        const listAfterDelete = await settingsPage.evaluate(async () => {
            const provider = globalThis._communicator?.testIdbProvider;
            if (!provider) throw new Error("testIdbProvider is not available in extension page context");
            return provider.list();
        });
        expect(listAfterDelete.some((e: any) => e.uuid === uuid)).toBe(false);

        // Uncomment for interactive debugging:
        // test.setTimeout(0);
        // await page.pause();
    });
});
