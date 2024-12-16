import { BrowserContextType, detectContext } from "@rshaker/context-detect";
import { CommMgr, CommMsg } from "../../src/communication";
import { CommunicatorIDBProvider } from "../../src/communicatorIDBProvider";
import { MessagingProvider } from "../../src/persistProviderMessaging";

const contextType: BrowserContextType = detectContext();
console.log(`Detected context type: '${contextType}' in workbench`);

function install() {
    switch (contextType) {
        case "background-worker":
            (async () => {
                const logIdbProvider = new CommunicatorIDBProvider("communicator", "log");
                const commMgr = CommMgr.getInstance({ persistProvider: logIdbProvider });
                commMgr.addListener(() => {
                    console.log(`Handled message in ${contextType}`);
                });
                commMgr.enableLogging(true);

                const testIdbProvider = new CommunicatorIDBProvider("communicator", "test");
                const testMessagingProvider = new MessagingProvider(commMgr, { idbProvider: testIdbProvider });

                globalThis._communicator = {};
                globalThis._communicator.commMgr = commMgr;
                globalThis._communicator.logIdbProvider = logIdbProvider;
                globalThis._communicator.testIdbProvider = testIdbProvider;
                globalThis._communicator.testMessagingProvider = testMessagingProvider;
                // globalThis._communicator.installIsolatedWorld = ???

                // TODO: Move ISOLATED_WORLD installation to a separate function
                // TODO: Attach function to globalThis._communicator.installIsolatedWorld() ?
                // TODO: Harden injection process, e.g. check if the script is already injected
                // TODO: Add method of enabling/disabling the "bridge" that's installed in isolated world

// BRIDGE BELOW // BRIDGE BELOW // BRIDGE BELOW // BRIDGE BELOW // BRIDGE BELOW // BRIDGE BELOW

                // Listen for any new (or reloaded) tabs and inject the workbench script
                chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
                    console.log(`Tab updated: ${tabId}, ${changeInfo.status}, ${tab.url}`);
                    const re = new RegExp("https://*");
                    if (changeInfo.status === "complete" && tab.url && re.test(tab.url)) {
                        await injectTab("playwright/harness/testWorkbench.js", tabId);
                    }
                });

                // Install the workbench script into all existing tabs
                try {
                    const tabs = await chrome.tabs.query({}); // {url: "<all_urls>"} or {url: "https://example.com/*"}
                    const validTabs = tabs.filter((tab) => tab.url?.startsWith("https://"));
                    await Promise.all(validTabs.map(async (tab) => {
                        await injectTab("playwright/harness/testWorkbench.js", tab.id!);
                    }));
                } catch (error) {
                    console.error("Error querying for matching tabs:", error);
                    throw error; // Unrecoverable error
                }

                async function injectTab(filePath: string, tabId: number): Promise<void> {
                    // await chrome.scripting.executeScript({
                    //     target: { tabId: tabId, allFrames: false },
                    //     files: [`${filePath}`],
                    //     world: "MAIN",
                    // });
                    await chrome.scripting.executeScript({
                        target: { tabId: tabId, allFrames: false },
                        files: [`${filePath}`],
                        world: "ISOLATED",
                    });
                }
            })();
            break;
        case "isolated-world":
            (() => {
                const commMgr = CommMgr.getInstance();
                commMgr.addListener(() => {
                    console.log(`Handled message in ${contextType}`);
                });
                commMgr.enableLogging(true);

                const testMessagingProvider = new MessagingProvider(commMgr, { storeName: "test" });

                globalThis._communicator = {};
                globalThis._communicator.commMgr = commMgr;
                globalThis._communicator.testMessagingProvider = testMessagingProvider;
            })();
            break;
        case "main-world":
            (() => {
                const commMgr = CommMgr.getInstance();
                commMgr.addListener(() => {
                    console.log(`Handled message in ${contextType}`);
                });
                commMgr.enableLogging(true);

                const testMessagingProvider = new MessagingProvider(commMgr, { storeName: "test" });

                globalThis._communicator = {};
                globalThis._communicator.commMgr = commMgr;
                globalThis._communicator.testMessagingProvider = testMessagingProvider;
            })();
            break;
        case "extension-page":
            (() => {
                const commMgr = CommMgr.getInstance();
                commMgr.addListener(() => {
                    console.log(`Handled message in ${contextType}`);
                });
                commMgr.enableLogging(true);

                const testIdbProvider = new CommunicatorIDBProvider("communicator", "test");

                globalThis._communicator = {};
                globalThis._communicator.commMgr = commMgr;
                globalThis._communicator.testIdbProvider = testIdbProvider;
            })();
            break;
        case "popup":
            (() => {
                const commMgr = CommMgr.getInstance();
                commMgr.addListener(() => {
                    console.log(`Handled message in ${contextType}`);
                });
                commMgr.enableLogging(true);

                const testIdbProvider = new CommunicatorIDBProvider("communicator", "test");

                globalThis._communicator = {};
                globalThis._communicator.commMgr = commMgr;
                globalThis._communicator.testIdbProvider = testIdbProvider;
            })();
            break;
        case "shared-worker":
        case "dedicated-worker":
            (() => {
                const commMgr = CommMgr.getInstance();
                commMgr.addListener(() => {
                    console.log(`Handled message in ${contextType}`);
                });
                commMgr.enableLogging(true);
            })();
            break;
        case "unknown":
            console.log("Unknown context detected");
            break;
        default:
            console.log("Unknown context type");
            break;
    }
}

install();
