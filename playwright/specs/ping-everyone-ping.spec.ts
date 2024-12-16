import fs, { glob } from "fs";
import path from "path";
import { BrowserContext, Page, test, Worker, expect } from "@playwright/test";
import { chromium, firefox, webkit } from "playwright";

const extensionPath = path.join(__dirname, "../../webext/chrome");
const userDataDir = ""; // Use a temporary directory
const testUrl = "https://example.com";

let context: BrowserContext;
let extensionId: string;
let page: Page;
let settingsPage: Page;
let serviceWorker: Worker;

test.describe("Test suite for the IndexedDBProvider interface", () => {
    test.beforeAll(async () => {
        context = await chromium.launchPersistentContext(userDataDir, {
            headless: false, // Extensions can't be loaded in headless mode, a browser limitation
            args: [
                `--disable-extensions-except=${extensionPath}`, 
                `--load-extension=${extensionPath}`
                ],
        });

        // Get the extensionId from the background page (works in Chromium browsers only)
        [serviceWorker] = context.serviceWorkers();
        if (!serviceWorker) {
            serviceWorker = await context.waitForEvent("serviceworker");
        }
        extensionId = serviceWorker.url().split("/")[2];
    });

    test.beforeEach(async ({}, _testInfo) => {
        // Open the test page
        page = await context.newPage();
        await page.goto(`${testUrl}`);
        await page.waitForURL(`${testUrl}`);
        await page.waitForLoadState("networkidle");

        // Open the extension page
        settingsPage = await context.newPage();
        await settingsPage.goto(`chrome-extension://${extensionId}/settings.html`);

        // Load toolkit for debugging and testing
        await loadWorkbench();
    });

    test.afterEach(async () => {
        await page.close();
        await settingsPage.close();
    });

    test.afterAll(async () => {
        await context.close();
    });

    test("Test pings", async () => {
        await serviceWorker.evaluate(() => {
            globalThis._communicator.commMgr.startPinger();
        });

        // Pause (for debugging)
        // test.setTimeout(0);
        // await page.pause();
    });

    async function loadWorkbench() {
        const scriptPath = path.join(__dirname, "../../webext/chrome/playwright/harness/testWorkbench.js");
        const scriptContent = fs.readFileSync(scriptPath, "utf8");

        // Load toolkit into all contexts
        await page.evaluate(scriptContent);
        await settingsPage.evaluate(scriptContent);
        await serviceWorker.evaluate(scriptContent);
    }
});
