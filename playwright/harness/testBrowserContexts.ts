import { detectContext, BrowserContextType } from "@rshaker/context-detect";

export async function getAllContexts(): Promise<any[]> {
    const currentContext = detectContext();
    let results: any[] = [currentContext];

    if (currentContext === BrowserContextType.BACKGROUND_WORKER) {
        results = [...results, ...await getPageContexts()];
    }
    return results;
}

export async function getPageContexts(): Promise<any[]> {
    let results: any[] = [];

    const tabs = await chrome.tabs.query({}); // {url: "<all_urls>"} or {url: "https://example.com/*"}
    const validTabs = tabs.filter((tab) => tab.url!.startsWith("https://"));
    await Promise.all(
        validTabs.map(async (tab) => {
            console.log(`Installing scripts in tab: ${tab.id}`);
            await chrome.scripting.executeScript({
                target: { tabId: tab.id!, allFrames: false },
                files: ["playwright/harness/testBrowserContexts.js"],
                world: "MAIN",
            });
            await chrome.scripting.executeScript({
                target: { tabId: tab.id!, allFrames: false },
                files: ["playwright/harness/testBrowserContexts.js"],
                world: "ISOLATED",
            });
            const mainResult = await chrome.scripting.executeScript({
                target: { tabId: tab.id!, allFrames: false },
                func: () => { return globalThis.getBrowserContext() },
                world: "MAIN",
            });
            const isolatedResult = await chrome.scripting.executeScript({
                target: { tabId: tab.id!, allFrames: false },
                func: () => { return globalThis.getBrowserContext() },
                world: "ISOLATED",
            });
            results = [...results, mainResult, isolatedResult];
        })
    );

    return results;
}

globalThis.getBrowserContext = detectContext;
globalThis.getAllContexts = getAllContexts;
globalThis.getPageContexts = getPageContexts;

console.log("testBrowserContexts.js loaded");

//# sourceURL=evaluate.or.executeScript
