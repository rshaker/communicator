import { PersistProvider, EntryProps } from "./persistProvider";

export class InMemoryProvider<T extends EntryProps> implements PersistProvider<T> {
    private storage: Map<string, T> = new Map();

    getStore(): string {
        return "in-memory";
    }

    async add(entry: T): Promise<string | null> {
        try {
            if (this.storage.has(entry.uuid)) return null; // Prevent duplicates
            const entryClone = structuredClone(entry);
            entryClone.created = entryClone.modified = Date.now();
            this.storage.set(entryClone.uuid, entry);
            return entryClone.uuid;
        } catch (error) {
            console.error("Error in add:", error);
            return null;
        }
    }

    async delete(uuid: string): Promise<string | null> {
        try {
            if (this.storage.has(uuid)) {
                this.storage.delete(uuid);
                return uuid;
            }
            return null;
        } catch (error) {
            console.error("Error in delete:", error);
            return null;
        }
    }

    async get(uuid: string): Promise<T | null> {
        try {
            return this.storage.get(uuid) || null;
        } catch (error) {
            console.error("Error in get:", error);
            return null;
        }
    }

    async update(entry: T): Promise<string | null> {
        try {
            if (this.storage.has(entry.uuid)) {
                const entryClone = structuredClone(entry);
                entryClone.modified = Date.now();
                this.storage.set(entryClone.uuid, entry);
                return entryClone.uuid;
            }
            return null;
        } catch (error) {
            console.error("Error in update:", error);
            return null;
        }
    }

    async list(): Promise<Partial<T>[] | null> {
        try {
            return Array.from(this.storage.values()).map((entry) => ({
                uuid: entry.uuid,
                id: entry.id,
                // Return as little as possible, to avoid message size limits
                // data: entry.data,
                created: entry.created,
                modified: entry.modified,
            }) as Partial<T>);
        } catch (error) {
            console.error("Error in list:", error);
            return null;
        }
    }
}
