import { PersistProvider, EntryProps } from "./persistProvider";
import { CommMgr, CommMsg } from "./communication";
// import { ContextType, getBrowserContext } from "./context";
import { detectContext, BrowserContextType } from "@rshaker/context-detect";
import { v4 as uuidv4 } from "uuid";

const PERSIST_CONTEXT = BrowserContextType.BACKGROUND_WORKER;

const TIMEOUT_ADD  = 1000, 
    TIMEOUT_DELETE = 1000,
    TIMEOUT_GET    = 1000,
    TIMEOUT_UPDATE = 1000,
    TIMEOUT_LIST   = 1000;

export class MessagingProvider<T extends EntryProps> implements PersistProvider<T> {
    private commMgr: CommMgr<CommMsg>;
    private idbProvider: PersistProvider<T>;
    private storeName: string;

    // constructor(commMgr: CommMgr<CommMsg>, idbProvider?: PersistProvider<T>) {
    constructor(commMgr: CommMgr<CommMsg>, options: { idbProvider?: PersistProvider<T>, storeName?: string }) {
        this.commMgr = commMgr;
        // this.idbProvider = idbProvider;
        options.idbProvider && (this.idbProvider = options.idbProvider);
        options.storeName && (this.storeName = options.storeName);

        // ONLY handle requests in a context that has access to the extension's IndexedDB
        if (detectContext() === PERSIST_CONTEXT) {
            this.listenForRequests();
        }
    }

    getStore(): string | null {
        return this?.storeName || this.idbProvider?.getStore();
    }

    async add(entry: T): Promise<string | null> {
        return new Promise<string | null>((resolve) => {
            // Compose message to context that has the IndexedDBProvider
            const requestMsg: CommMsg = {
                id: uuidv4(),
                type: "request",
                toContext: PERSIST_CONTEXT,
                payload: { storeName: this.getStore(), action: "add", entry: entry },
            };

            // Listen for response
            const listener = (responseMsg: CommMsg) => {
                if (responseMsg?.responseId === requestMsg.id && responseMsg.type === "response") {
                    clearTimeout(timeoutId);
                    this.commMgr.removeListener(listener);
                    resolve(responseMsg.payload?.entryId || null);
                }
            };
            this.commMgr.addListener(listener);

            // Limit time to wait for response
            const timeoutId = setTimeout(() => {
                this.commMgr.removeListener(listener);
                console.error("Timeout: No response received for add");
                resolve(null);
            }, TIMEOUT_ADD);

            // Send message requesting the 'add'
            this.commMgr.sendMessage(requestMsg).catch((error) => {
                clearTimeout(timeoutId);
                this.commMgr.removeListener(listener);
                console.error("Error in add", error);
                resolve(null);
            });
            console.log("Sent message requesting the 'add'", requestMsg);
        });
    }

    async delete(uuid: string): Promise<string | null> {
        return new Promise<string | null>((resolve) => {
            // Compose message to context that has the IndexedDBProvider
            const requestMsg: CommMsg = {
                // TODO: Think about -id- vs msgId vs threadId vs responseId, what is correct?
                // msgId, msgType, entryId, 
                id: uuidv4(),
                type: "request",
                toContext: PERSIST_CONTEXT,
                payload: { storeName: this.getStore(), action: "delete", entryId: uuid },
            };

            // Listen for response
            const listener = (responseMsg: CommMsg) => {
                if (responseMsg?.responseId === requestMsg.id && responseMsg.type === "response") {
                    clearTimeout(timeoutId);
                    this.commMgr.removeListener(listener);
                    resolve(responseMsg.payload?.entryId || null); // return uuid
                }
            };
            this.commMgr.addListener(listener);

            // Limit time to wait for response
            const timeoutId = setTimeout(() => {
                this.commMgr.removeListener(listener);
                console.error("Timeout: No response received for delete");
                resolve(null);
            }, TIMEOUT_DELETE);

            // Send message requesting the 'delete'
            this.commMgr.sendMessage(requestMsg).catch((error) => {
                clearTimeout(timeoutId);
                this.commMgr.removeListener(listener);
                console.error("Error in delete", error);
                resolve(null);
            });
        });
    }

    async get(uuid: string): Promise<T | null> {
        return new Promise<T | null>((resolve) => {
            // Compose message to context that has the IndexedDBProvider
            const requestMsg: CommMsg = {
                id: uuidv4(),
                type: "request",
                toContext: PERSIST_CONTEXT,
                payload: { storeName: this.getStore(), action: "get", entryId: uuid },
         };

            // Listen for response
            const listener = (responseMsg: CommMsg) => {
                if (responseMsg?.responseId === requestMsg.id && responseMsg.type === "response") {
                    clearTimeout(timeoutId);
                    this.commMgr.removeListener(listener);
                    resolve(responseMsg.payload?.entry || null);
                }
            };
            this.commMgr.addListener(listener);

            // Limit time to wait for response
            const timeoutId = setTimeout(() => {
                this.commMgr.removeListener(listener);
                console.error("Timeout: No response received for get");
                resolve(null);
            }, TIMEOUT_GET);

            // Send message requesting the 'get'
            this.commMgr.sendMessage(requestMsg).catch((error) => {
                clearTimeout(timeoutId);
                this.commMgr.removeListener(listener);
                console.error("Error in get", error);
                resolve(null);
            });
        });
    }

    async update(entry: T): Promise<string | null> {
        return new Promise<string | null>((resolve) => {
            // Compose message to context that has the IndexedDBProvider
            const requestMsg: CommMsg = {
                id: uuidv4(),
                type: "request",
                toContext: PERSIST_CONTEXT,
                payload: { storeName: this.getStore(), action: "update", entry: entry },
            };

            // Listen for response
            const listener = (responseMsg: CommMsg) => {
                if (responseMsg?.responseId === requestMsg.id && responseMsg.type === "response") {
                    clearTimeout(timeoutId);
                    this.commMgr.removeListener(listener);
                    resolve(responseMsg.payload?.entryId || null);
                }
            };
            this.commMgr.addListener(listener);

            // Limit time to wait for response
            const timeoutId = setTimeout(() => {
                this.commMgr.removeListener(listener);
                console.error("Timeout: No response received for update");
                resolve(null);
            }, TIMEOUT_UPDATE);

            // Send message requesting the 'update'
            this.commMgr.sendMessage(requestMsg).catch((error) => {
                clearTimeout(timeoutId);
                this.commMgr.removeListener(listener);
                console.error("Error in update", error);
                resolve(null);
            });
        });
    }

    async list(): Promise<Partial<T>[] | null> {
        return new Promise<Partial<T>[] | null>((resolve) => {
            // Compose message to context that has the IndexedDBProvider
            const requestMsg: CommMsg = {
                id: uuidv4(),
                type: "request",
                toContext: PERSIST_CONTEXT,
                payload: { storeName: this.getStore(), action: "list" },
            };

            // Listen for response
            const listener = (responseMsg: CommMsg) => {
                if (responseMsg?.responseId === requestMsg.id && responseMsg.type === "response") {
                    clearTimeout(timeoutId);
                    this.commMgr.removeListener(listener);
                    resolve(responseMsg.payload?.entry || []);
                }
            };
            this.commMgr.addListener(listener);

            // Limit time to wait for response
            const timeoutId = setTimeout(() => {
                this.commMgr.removeListener(listener);
                console.error("Timeout: No response received for list");
                resolve(null);
            }, TIMEOUT_LIST);

            // Send message requesting the 'list'
            this.commMgr.sendMessage(requestMsg).catch((error) => {
                clearTimeout(timeoutId);
                this.commMgr.removeListener(listener);
                console.error("Error in list", error);
                resolve(null);
            });
        });
    }

    private listenForRequests() {
        this.commMgr.addListener((message) => {
            const storeName = message.payload?.storeName;
            if (storeName !== this.getStore()) {
                return;
            }
            const action = message.payload?.action;
            if (action === "add") {
                this.addResponder?.(message);
            } else if (action === "delete") {
                this.deleteResponder?.(message);
            } else if (action === "get") {
                this.getResponder?.(message);
            } else if (action === "update") {
                this.updateResponder?.(message);
            } else if (action === "list") {
                this.listResponder?.(message);
            }
        });
    }

    private async addResponder(message: CommMsg): Promise<void>  {
        // TODO: This should probably try and trap errors??? not sure
        console.log("Called addResponder with message", message);
        const entryId = await this.idbProvider?.add(message.payload.entry);
        const responseMsg: CommMsg = {
            id: uuidv4(),
            responseId: message.id,
            type: "response",
            toContext: message.fromContext,
            payload: { entryId: entryId }, // TODO: Maybe should use `{ id: entryId }` instead of `entryId`, get rid of top-levels??
        };
        await this.commMgr.sendMessage(responseMsg);
    }

    private async deleteResponder(message: CommMsg): Promise<void>  {
        const entryId = await this.idbProvider?.delete(message.payload.entryId);
        const responseMsg: CommMsg = {
            id: uuidv4(),
            responseId: message.id,
            type: "response",
            toContext: message.fromContext,
            payload: { entryId: entryId },
        };
        await this.commMgr.sendMessage(responseMsg);
    }

    private async getResponder(message: CommMsg): Promise<void>  {
        const entry = await this.idbProvider?.get(message.payload.entryId);
        const responseMsg: CommMsg = {
            id: uuidv4(),
            responseId: message.id,
            type: "response",
            toContext: message.fromContext,
            payload: { entry: entry },
        };
        await this.commMgr.sendMessage(responseMsg);
    }

    private async updateResponder(message: CommMsg): Promise<void>  {
        const entryId = await this.idbProvider?.update(message.payload.entry);
        const responseMsg: CommMsg = {
            id: uuidv4(),
            responseId: message.id,
            type: "response",
            toContext: message.fromContext,
            payload: { entryId: entryId },
        };
        await this.commMgr.sendMessage(responseMsg);
    }

    private async listResponder(message: CommMsg): Promise<void> {
        const entries = await this.idbProvider?.list();
        // TODO: The `result` should be mapped to a new array of objects with only the necessary properties (uuid, id, timestamps)
        const responseMsg: CommMsg = {
            id: uuidv4(),
            responseId: message.id,
            type: "response",
            toContext: message.fromContext,
            payload: { entry: entries },
        };
        await this.commMgr.sendMessage(responseMsg);
    }
}
