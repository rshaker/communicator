import { PersistProvider, EntryProps } from "./persistProvider";
import { openDB, IDBPDatabase } from "idb";
import { v4 as uuidv4 } from "uuid";

export interface StoreConfig {
    name: string;
    keyPath: string;
    autoIncrement?: boolean;
    indexes?: { name: string; keyPath: string; options?: IDBIndexParameters }[];
    entries?: any[];
}

export abstract class IndexedDBProvider<T extends EntryProps> implements PersistProvider<T> {
    private _db: Promise<IDBPDatabase<unknown>> | null = null;
    readonly dbName: string;
    readonly storeName: string;

    get db(): Promise<IDBPDatabase<unknown>> {
        if (!this._db) {
            this._db = this.initDB();
        }
        return this._db;
    }

    constructor(dbName: string, storeName: string) {
        this.dbName = dbName;
        this.storeName = storeName;
    }

    protected abstract getStores(): StoreConfig[];

    private async initDB(): Promise<IDBPDatabase<unknown>> {
        const stores = this.getStores();
        return openDB(this.dbName, 1, {
            upgrade(db) {
                stores.forEach(({ name, keyPath, autoIncrement, indexes, entries }) => {
                    if (!db.objectStoreNames.contains(name)) {
                        const os = db.createObjectStore(name, { keyPath, autoIncrement });
                        indexes?.forEach(({ name: indexName, keyPath, options }) => {
                            os.createIndex(indexName, keyPath, options);
                        });

                        if (entries && entries.length > 0) {
                            os.transaction.oncomplete = () => {
                                const tx = db.transaction(name, "readwrite");
                                const store = tx.objectStore(name);
                                entries.forEach((entry) => {
                                    store.add(entry);
                                });
                            };
                        }
                    }
                });
            },
        });
    }

    getStore(): string {
        return this.storeName;
    }

    async add(entry: T): Promise<string | null> {
        try {
            const tx = (await this.db).transaction(this.storeName, "readwrite");
            const entryClone = structuredClone(entry);
            entryClone.uuid = entryClone.uuid || uuidv4();
            entryClone.created = entryClone.modified = Date.now();
            await tx.store.add(entryClone);
            await tx.done;
            return entryClone.uuid;
        } catch (error) {
            console.error(`Failure on add to store ${this.storeName} error:`, error);
            return null;
        }
    }

    async delete(uuid: string): Promise<string | null> {
        try {
            const tx = (await this.db).transaction(this.storeName, "readwrite");
            await tx.store.delete(uuid);
            await tx.done;
            return uuid;
        } catch (error) {
            console.error("Error in delete:", error);
            return null;
        }
    }

    async get(uuid: string): Promise<T | null> {
        try {
            const tx = (await this.db).transaction(this.storeName, "readonly");
            const result = await tx.store.get(uuid);
            await tx.done;
            return result as T | null;
        } catch (error) {
            console.error("Error in get:", error);
            return null;
        }
    }

    async update(entry: T): Promise<string | null> {
        try {
            const tx = (await this.db).transaction(this.storeName, "readwrite");
            const entryClone = structuredClone(entry);
            entryClone.modified = Date.now();
            await tx.store.put(entryClone);
            await tx.done;
            return entryClone.uuid;
        } catch (error) {
            console.error("Error in update:", error);
            return null;
        }
    }

    async list(): Promise<Partial<T>[] | null> {
        // TODO: expand parameters to allow for filtering, sorting, etc.
        // See: https://stackoverflow.com/questions/12084177/in-indexeddb-is-there-a-way-to-make-a-sorted-compound-query
        try {
            const tx = (await this.db).transaction(this.storeName, "readonly");
            const results = await tx.store.getAll();
            await tx.done;
            return results as Partial<T>[];
        } catch (error) {
            console.error("Error in list:", error);
            return null;
        }
    }
}
