export interface EntryProps {
    uuid?: string;
    id?: number; // auto-incremented by IndexedDB, but overridden if provided
    data: any;
    created?: number;
    modified?: number;
}

export interface PersistProvider<T extends EntryProps> {
    getStore(): string; // TODO: storeName is not used in InMemoryProvider, should there be an equivalent?
    add(obj: T): Promise<string | null>;
    delete(uuid: string): Promise<string | null>;
    get(uuid: string): Promise<T | null>;
    update(obj: T): Promise<string | null>;
    list(): Promise<Partial<T>[] | null>;
}
