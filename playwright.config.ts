import path from "path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export default defineConfig({
    testDir: "playwright/specs",
    // It's not possible to run projects sequentially and run tests in parallel at the same time,
    // everything will run in parallel if anything is run in parallel and the number of workers is greater than 1.
    // This seems to be a limitation of Playwright. But we don't want to run in parallel anyway.
    fullyParallel: false,
    forbidOnly: !!process.env.CI, // don't know what forbidOnly does
    retries: process.env.CI ? 2 : 0,
    workers: 1, // No parallel testing allowed!

    // Reporter to use. See https://playwright.dev/docs/test-reporters
    reporter: [
        ["list"], // Console output
        ["html", { open: "never", outputFolder: "playwright/playwright-report" }],
    ],
    outputDir: "playwright/test-results", // Set the directory for screenshots, videos, etc.
    use: {
        viewport: { width: 1200, height: 800 },

        // Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer
        trace: "on",
        // video: "on", // Won't work here, because we use custom contexts in our tests
    },
    projects: [
        // { name: "auth", testMatch: /auth\.setup\.ts/ },

        // Projects that reuse the authenticated session state
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"],
                // storageState, // Reuse cookies
                // launchOptions: {
                //     args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
                // },
            },
            // dependencies: ["auth"],
        },
    ],
});
