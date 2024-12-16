import { v4 as uuidv4 } from "uuid";
import { detectContext, BrowserContextType } from "@rshaker/context-detect";
import { PersistProvider } from "./persistProvider";

export const TARGET_ORIGIN = "<all_urls>"; // TARGET_ORIGIN = "https://example.com/*";

export type MsgType = "ping" | "request" | "response";

export interface CommMsg {
    type: MsgType;
    id: string;
    responseId?: string;
    log?: boolean;
    payload?: {
        action?: string;
        storeName?: string;
        entry?: any;
        entryId?: string;
    };
    toContext: BrowserContextType;
    fromContext?: BrowserContextType;
    toTab?: number;
    fromTab?: number;
    toOrigin?: string;
    fromOrigin?: string;
    hops?: BrowserContextType[];
}

export interface CommMgrOptions {
    persistProvider?: PersistProvider<any>;
    loggingEnabled?: boolean;
}

export class CommMgr<T extends CommMsg> {
    private static instance: CommMgr<any>;
    private currentContext: BrowserContextType;
    private EVENT_TYPE = "message";
    private persistProvider?: PersistProvider<any> = null; // For recording logged messages
    private intervalId: NodeJS.Timeout | null = null; // Handle to pinger's interval timer (#1)
    private enableMessageLogging = false;

    private constructor(options?: CommMgrOptions) {
        this.currentContext = detectContext();
        this.persistProvider = options?.persistProvider;
        this.enableMessageLogging = options?.loggingEnabled ?? false;
    }

    // Instance's listeners, where you can subscribe to events received by-your context from-other contexts
    private listeners: Set<(event: T) => void> = new Set(); // (#2)

    addListener(listener: (event: T) => void): void {
        this.listeners.add(listener);
    }
    removeListener(listener: (event: T) => void): void {
        this.listeners.delete(listener);
    }

    // Listener for events triggered by window.postMessage() (#3)
    private windowListener: (event: MessageEvent<T>) => void | null = null;

    // Listener for events triggered by chrome.tabs.sendMessage() and chrome.runtime.sendMessage() (#4)
    private runtimeListener: (
        message: T,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: any) => void
    ) => void | null = null;

    // Returns the singleton instance, allowing for configuration only on creation
    public static getInstance<T extends CommMsg>(options?: CommMgrOptions): CommMgr<T> {
        if (!CommMgr.instance) {
            CommMgr.instance = new CommMgr(options);
            CommMgr.instance.init();
        }
        return CommMgr.instance as CommMgr<T>;
    }

    // Based on the context, add the appropriate listeners
    private init() {
        switch (this.currentContext) {
            case BrowserContextType.ISOLATED_WORLD:
                this.initIsolatedContext();
                break;
            case BrowserContextType.MAIN_WORLD:
                this.initMainContext();
                break;
            case BrowserContextType.EXTENSION_PAGE:
                this.initExtensionPageContext();
                break;
            case BrowserContextType.BACKGROUND_WORKER:
                this.initBackgroundContext();
                break;
            default:
                throw new Error("Invalid context: " + this.currentContext);
        }
    }

    public destruct() {
        if (this.windowListener) {
            window.removeEventListener(this.EVENT_TYPE, this.windowListener);
            this.windowListener = null; // Clear reference to listener (#3)
        }
        if (this.runtimeListener) {
            chrome.runtime.onMessage.removeListener(this.runtimeListener);
            this.runtimeListener = null; // Clear reference to listener (#4)
        }
        if (this.intervalId) {
            clearInterval(this.intervalId); // Clear interval, stopping the pinger as a result (#1)
        }
        this.listeners.clear(); // Clear references to all subscribed listeners (#2)
    }

    async emitMessage(message: T): Promise<void> {
        // console.log(`Called emitMessage() in context: ${this.currentContext}`, message);
        
        const msgCopy = structuredClone(message); // Don't modify passed object

        // Handle case where message is NOT a log message
        if (!msgCopy.log) {
            msgCopy.hops.push(this.currentContext); // Last hop for this non-log message
            for (const listener of this.listeners) {
                const msgCopy4Listener = structuredClone(msgCopy);
    
                // console.log(`Invoking listener() for emit, in context: ${this.currentContext}`, msgCopy4Listener);
                listener(msgCopy4Listener);
            }
            if (this.enableMessageLogging) {
                msgCopy.log = true; // Send message on its way to be logged
            }    
        }

        // Handle case where message IS a log message
        if (msgCopy.log) {
            if (this.currentContext === BrowserContextType.BACKGROUND_WORKER) {
                if (this.persistProvider) {
                    // console.log(`Adding to ${this.persistProvider.getStore()} with persistProvider`, msgCopy);
                    await this.persistProvider.add({ data: message });
                } else {
                    // console.log(`No persist provider set, unable to log message in context: ${this.currentContext}`, msgCopy);
                }
            }
            else {
                // We're not in background context, so send log message on its way to be logged
                // console.log(`Sending log message on from context ${this.currentContext} in emitMessage() to sendMessage()`, msgCopy);
                await this.sendMessage(msgCopy);
            }
        }
    }

    public async sendMessage(message: T): Promise<void> {
        // console.log(`Called sendMessage() in context: ${this.currentContext}`, message);

        const msg = structuredClone(message); // Don't modify passed object
        msg.id ||= uuidv4();
        msg.fromContext ||= this.currentContext;
        msg.hops ||= [];
        msg.log ||= false;

        // Record hop if this isn't a log message
        !msg.log && msg.hops.push(this.currentContext);

        // Emit message if it has reached its destination
        if ((msg.log && this.currentContext === BrowserContextType.BACKGROUND_WORKER) || 
            !msg.log && this.currentContext === msg.toContext
        ) {
            await this.emitMessage(msg);
            return;
        }

        // Message hasn't reached its destination yet, so send it on (applies to both log and non-log messages)
        switch (this.currentContext) {
            case BrowserContextType.BACKGROUND_WORKER:
                if ([BrowserContextType.ISOLATED_WORLD, BrowserContextType.MAIN_WORLD].includes(msg.toContext)) {
                    await this.sendMessageTab(msg);
                } else if (msg.toContext === BrowserContextType.EXTENSION_PAGE) {
                    await this.sendMessageRuntime(msg);
                }
                break;
            case BrowserContextType.EXTENSION_PAGE:
                await this.sendMessageRuntime(msg);
                break;
            case BrowserContextType.ISOLATED_WORLD:
                if (!msg.log && msg.toContext === BrowserContextType.MAIN_WORLD) {
                    await this.sendMessagePost(msg);
                } else {
                    await this.sendMessageRuntime(msg);
                }
                break;
            case BrowserContextType.MAIN_WORLD:
                await this.sendMessagePost(msg);
                break;
        }
    }

    private sendMessagePost(message: T): Promise<void> {
        // console.log(`Called sendMessagePost() in context: ${this.currentContext}`, message);

        return new Promise((resolve) => {
            const msg = structuredClone(message); // Don't modify passed object
            window.postMessage(msg);
            console.log(`Sent message via postMessage() in context: ${this.currentContext}`, msg);
            
            resolve();
        });
    }

    private sendMessageRuntime(message: T): Promise<void> {
        // console.log(`Called sendMessageRuntime in context: ${this.currentContext}`, message);

        return new Promise((resolve) => {
            const msg = structuredClone(message); // Don't modify passed object
            try {
                chrome.runtime.sendMessage(msg, () => {
                    if (chrome.runtime.lastError &&
                        !chrome.runtime.lastError.message.includes(
                            "The message port closed before a response was received.") &&
                        !chrome.runtime.lastError.message.includes(
                            "Receiving end does not exist")
                    ) {
                        console.error(`Error sending message via runtime.sendMessage: ${chrome.runtime.lastError.message}`, msg);
                    }
                    resolve();
                });
            } catch (error) {
                console.error(`Error sending message via chrome.runtime.sendMessage: ${error}`, msg);
                resolve();
            }
        });
    }

    private async sendMessageTab(message: T): Promise<void> {
        // console.log(`Called sendMessageTab in context: ${this.currentContext}`, message);

        const msg = structuredClone(message); // Don't modify passed object
        const currentContext = this.currentContext; // Capture for inner function

        const sendToTab = (tabId: number): Promise<void> => {
            // console.log(`Called sendToTab() in context: ${currentContext}`, msg);
            return new Promise((resolve) => {
                try {
                    // console.log(`Invoking tabs.sendMessage to tab id: ${tabId}`, msg);
                    chrome.tabs.sendMessage(tabId, msg, () => {
                        if (chrome.runtime.lastError &&
                            !chrome.runtime.lastError.message.includes(
                                "The message port closed before a response was received.") &&
                            !chrome.runtime.lastError.message.includes(
                                "Could not establish connection. Receiving end does not exist.")                    ) {
                            console.error(`Error in tabs.sendMessage to tab: ${tabId}`, chrome.runtime.lastError.message, msg);
                        }
                        resolve();
                    });
                } catch (error) {
                    console.error(`Synchronous error sending to tab ${tabId}:`, error);
                    resolve();
                }
            });
        };

        try {
            if (msg.toTab) {
                // Check if tab exists first
                try {
                    await chrome.tabs.get(msg.toTab);
                    await sendToTab(msg.toTab);
                } catch (error) {
                    console.error(`Tab ${msg.toTab} not found or error checking tab:`, error);
                }
            } else {
                // Only query for http/https tabs directly
                const tabs = await chrome.tabs.query({
                    url: ["http://*/*", "https://*/*"]
                });
                
                if (tabs.length > 0) {
                    // console.log(`Broadcasting to ${tabs.length} tabs`);
                    await Promise.allSettled(
                        tabs.map((tab) => {
                            if (tab.id) {
                                return sendToTab(tab.id);
                            }
                            return Promise.resolve(); // Skip tabs without id
                        })
                    );
                }
            }
        } catch (error) {
            console.error("Error in sendMessageTab:", error);
        }
    }

    /* It's possible to check if receiving end exists beforehand by using chrome.runtime.getContexts() or
    chrome.runtime.getViews(), but getViews() is no longer supported in Chrome.It's better to just try/catch/ignore. */

    /**
     * Each type of context has different listeners for incoming messages.
     * The listeners are set up in the init() function.
     * The listeners are removed in the destruct() function.
     */

    private initMainContext() {
        this.windowListener = (event: MessageEvent<T>) => {
            const message = event.data;
            if (!message.log && message.toContext === this.currentContext) {
                this.emitMessage(message);
            }
        };
        window.addEventListener(this.EVENT_TYPE, this.windowListener);
    }

    private initIsolatedContext() {
        this.runtimeListener = (message: T, _sender, _sendResponse) => {
            // Ignore log messages and anything not addressed to MAIN,
            // the background is listening and will handle those cases
            if (!message.log) {
                if (message.toContext === this.currentContext) {
                    this.emitMessage(message);
                } else if (message.toContext === BrowserContextType.MAIN_WORLD) {
                    this.sendMessage(message);
                }
            }
        };
        chrome.runtime.onMessage.addListener(this.runtimeListener);

        this.windowListener = async (event: MessageEvent<T>) => {
            const message = event.data;
            if (message.log || [BrowserContextType.BACKGROUND_WORKER, BrowserContextType.EXTENSION_PAGE].includes(message.toContext)) {
                // Relay log messages, along with anything addressed to BACKGROUND or EXTENSION
                this.sendMessage(message);
            } else if (message.toContext === this.currentContext) {
                this.emitMessage(message);
            }
        };
        window.addEventListener(this.EVENT_TYPE, this.windowListener);
    }

    private initExtensionPageContext() {
        // Ignore log messages and anything not addressed to EXTENSION,
        // the background is listening and will handle those cases.
        this.runtimeListener = (message: T, _sender, _sendResponse) => {
            if (!message.log) {
                if (message.toContext === this.currentContext) {
                    this.emitMessage(message);
                }
            }
        };
        chrome.runtime.onMessage.addListener(this.runtimeListener);
    }

    private initBackgroundContext() {
        this.runtimeListener = (message: T, sender, _sendResponse) => {
            message.fromTab = sender.tab?.id ?? null;
            if (message.log || message.toContext === this.currentContext) {
                // console.log(`Emitting message, log status: ${message.log}`, message);
                this.emitMessage(message);
            } else if (message.toContext === BrowserContextType.MAIN_WORLD || message.toContext === BrowserContextType.ISOLATED_WORLD) {
                // Tabs can't hear extension pages, so act as a relay
                // for messages sent from ext page to MAIN and ISOLATED.
                this.sendMessage(message);
            }
        };
        chrome.runtime.onMessage.addListener(this.runtimeListener);
    }

    public startPinger({ intervalMs = 1000, iterations = 3 } = {}) {
        console.log(`Starting pinger with interval: ${intervalMs}ms, iterations: ${iterations}`);

        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        let remainingIterations = iterations;
        this.intervalId = setInterval(() => {
            const targetContexts: BrowserContextType[] = [
                BrowserContextType.BACKGROUND_WORKER,
                BrowserContextType.MAIN_WORLD,
                BrowserContextType.ISOLATED_WORLD,
                BrowserContextType.EXTENSION_PAGE,
            ];

            targetContexts.forEach((target) => {
                if (target !== this.currentContext) {
                    console.log(`Sending ping to context: ${target} from ${detectContext()}`);

                    this.sendMessage({ type: "ping", toContext: target } as T);
                }
            });

            remainingIterations--;
            if (remainingIterations < 1) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        }, intervalMs);
    }

    public stopPinger() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    public enableLogging(enabled: boolean) {
        // console.log(`Setting message logging to: ${enabled}`);

        this.enableMessageLogging = enabled;
    }
}
