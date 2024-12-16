import { EntryProps } from "./persistProvider";
import { IndexedDBProvider, StoreConfig } from "./persistProviderIndexedDB";

export class CommunicatorIDBProvider extends IndexedDBProvider<EntryProps> {
    constructor(dbName: string, storeName: string) {
        super(dbName, storeName);
    }

    protected getStores(): StoreConfig[] {
        return [
            {
                name: "log",
                keyPath: "uuid",
                indexes: [
                    { name: "log_uuid", keyPath: "uuid", options: { unique: true } },
                    { name: "log_created", keyPath: "created" },
                    { name: "log_modified", keyPath: "modified" },
                    { name: "log_fromContext", keyPath: "data.fromContext" },
                    { name: "log_toContext", keyPath: "data.toContext" },
                    { name: "log_toTab", keyPath: "data.toTab" },
                    { name: "log_fromTab", keyPath: "data.fromTab" },
                    { name: "log_toOrigin", keyPath: "data.toOrigin" },
                    // NOTE: The IndexedDB spec does not support indexing boolean values,
                    // the workaround is to use a string or number representation of the boolean value.
                    // https://www.w3.org/TR/IndexedDB/#dfn-valid-key:~:text=NOTE%3A%20The,key%20will%20fail.
                    { name: "log_log", keyPath: "data.log" },
                ],
            },
            {
                name: "test",
                keyPath: "uuid",
                indexes: [
                    { name: "test_uuid", keyPath: "uuid", options: { unique: true } },
                    { name: "test_created", keyPath: "created" },
                    { name: "test_modified", keyPath: "modified" },
                ],
            },
        ];
    }
}
