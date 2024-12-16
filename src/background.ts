import { detectContext } from "@rshaker/context-detect";

console.info(`Startup in context: ${detectContext()}`);

/*
import { CommMgr, CommMsg } from "./communication";
import { CommunicatorIDBProvider } from "./communicatorIDBProvider";
// import { getBrowserContext } from "./context";
import { detectContext } from "@rshaker/context-detect";
import { MessagingProvider } from "./persistProviderMessaging";

console.info(`Startup in context: ${detectContext()}`);

// Install scripts in updated tabs, and on extension [re]load
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    const re = new RegExp("https://*"); // Normally, this pattern would be more restrictive
    if (changeInfo.status === "complete" && tab.url && re.test(tab.url)) {
        await installScripts(tabId);
    }
});

// This was the original code to install scripts in all existing tabs...
// const tabs = await chrome.tabs.query({}); // {url: "<all_urls>"} or {url: "https://example.com/*"}
// tabs.filter((tab) => tab.url.startsWith("https://")).forEach(async (tab) => {
//     await installScripts(tab.id);
// });
//
// // Must check for `lastError` after querying tabs! (or you'll get a console error)
// if (chrome.runtime.lastError) {
//     console.error(`Error querying for matching tabs, error: ${chrome.runtime.lastError}`);
//     throw new Error(`Error querying for matching tabs, error: ${chrome.runtime.lastError}`); // Unrecoverable error
// }

// Install scripts in all existing tabs
try {
    const tabs = await chrome.tabs.query({}); // {url: "<all_urls>"} or {url: "https://example.com/*"}
    const validTabs = tabs.filter((tab) => tab.url.startsWith("https://"));
    await Promise.all(validTabs.map(async (tab) => {
        await installScripts(tab.id);
    }));
} catch (error) {
    console.error("Error querying for matching tabs:", error);
    throw error; // Unrecoverable error
}

const logIdbProvider = new CommunicatorIDBProvider("communicator", "log");
const testIdbProvider = new CommunicatorIDBProvider("communicator", "test");

// Install comm manager
const commMgr = CommMgr.getInstance({ persistProvider: logIdbProvider });
commMgr.addListener(commMgrHandler);
commMgr.enableLogging(true);

const testMessagingProvider = new MessagingProvider(commMgr, { idbProvider: testIdbProvider });

async function installScripts(tabId: number): Promise<void> {
    await chrome.scripting.executeScript({
        target: { tabId: tabId, allFrames: false },
        files: ["./scripts/worldMain.js"],
        world: "MAIN",
    });
    await chrome.scripting.executeScript({
        target: { tabId: tabId, allFrames: false },
        files: ["./scripts/worldIsolated.js"],
        world: "ISOLATED",
    });
}

async function commMgrHandler(message: CommMsg) {
    console.log(`Handled message from ${message?.fromContext} in ${detectContext()}` , message);
}

// For debugging purposes, expose the communicator to the global scope.
// This is not recommended for production code, as it can expose sensitive data
// and create security vulnerabilities. Use with caution.
globalThis._communicator = {};
globalThis._communicator.commMgr = commMgr;
globalThis._communicator.logIdbProvider = logIdbProvider;
globalThis._communicator.testIdbProvider = testIdbProvider;
globalThis._communicator.testMessagingProvider = testMessagingProvider;
*/