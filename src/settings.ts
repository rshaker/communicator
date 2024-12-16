import { detectContext } from "@rshaker/context-detect";

console.info(`Startup in context: ${detectContext()}`);

/**

import { CommMgr, CommMsg } from "./communication";
import { IndexedDBProvider } from "./persistProviderIndexedDB";

let commMgr: CommMgr<CommMsg> = null;
// let intervalId: NodeJS.Timeout = null;

commMgr = CommMgr.getInstance();
commMgr.addListener(commMgrHandler);
commMgr.enableLogging(true);

// Periodically, add a random number to the object store
// const idbProvider = new IndexedDBProvider("communicator", "test");
// intervalId = setInterval(async () => {
//     const list = await idbProvider.list();
//     // console.log(`List from idbProvider:`, list);
//     // -- DO SOMETHING HERE --
//     // Update html page to display the list
// }, 3000);

function commMgrHandler(message: CommMsg) {
    console.log(`Handled message from ${message?.fromContext} in ${detectContext()}`, message);
}

// For debugging purposes, expose the communicator to the global scope.
// This is not recommended for production code, as it can expose sensitive data
// and create security vulnerabilities. Use with caution.
globalThis._communicator = {};
globalThis._communicator.commMgr = commMgr;

 */

