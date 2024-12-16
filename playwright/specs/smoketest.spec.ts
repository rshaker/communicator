import path from "path"
import { BrowserContext, Page, test, Worker } from "@playwright/test";
import { chromium, firefox, webkit } from "playwright";

const extensionPath = path.join(__dirname, "../../webext/chrome");
const userDataDir = ""; // Use a temporary directory
const testUrl = "https://example.com";

let context: BrowserContext;
let extensionId: string;
let page: Page;

let serviceWorker: Worker;

test.describe("Test with extension", () => {
    test.beforeAll(async () => {
        context = await chromium.launchPersistentContext(userDataDir, {
            headless: false, // Extension can't be loaded in headless mode
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

    test.beforeEach(async ({}, testInfo) => {
        page = await context.newPage();
        await page.goto(`${testUrl}`);
        await page.waitForURL(`${testUrl}`);
        await page.waitForLoadState("networkidle");
    });

    test.afterEach(async () => {
        await page.close();
    });

    test.afterAll(async () => {
        await context.close();
    });

    test("Take a look around, for maintenance only", async () => {
        // test.setTimeout(0);
        // await page.pause();
    });

    /*
    * Install extension
    - background script installs communicator
    */
});
