// import { CommMgr, CommMsg } from "../communication";
import { detectContext } from "@rshaker/context-detect";
// import { MessagingProvider } from "../persistProviderMessaging";

console.info(`Startup in context: ${detectContext()}`);

/* 
// Uncomment this block to automatically install the commMgr.

let commMgr: CommMgr<CommMsg> = null;
// let intervalId: NodeJS.Timeout = null;

function install() {
    commMgr = CommMgr.getInstance();
    commMgr.addListener(commMgrHandler);
    commMgr.enableLogging(true);

    // Periodically add a random number to the object store
    // const ppm = new MessagingProvider(commMgr, { storeName: "test" }); 
    // intervalId = setInterval(async () => {
    //     const result = await ppm.add({ 
    //         data: Math.random() * 1000,
    //     });
    // }, 3000);
}

function commMgrHandler(message: CommMsg) {
    console.log(`Handled message from ${message?.fromContext} in ${detectContext()}`, message);
}

install();

function destructor() {
    // Stop listening for destruction events
    document.removeEventListener(destructionEvent, destructor);
    // Tear down content script: Remove listeners, clear timers, etc.
    commMgr && commMgr.destruct();
    // intervalId && clearInterval(intervalId);
}

// Unload previous content script by signaling it to destruct
var destructionEvent = `destructmyextension_${detectContext()}`// + chrome.runtime.id;
document.dispatchEvent(new CustomEvent(destructionEvent));

// Set up new (or replacement) content script, now listening for its future destruction event to arrive
document.addEventListener(destructionEvent, destructor);

// For debugging purposes, expose the communicator to the global scope.
// This is not recommended for production code, as it can expose sensitive data
// and create security vulnerabilities. Use with caution.
globalThis._communicator = {};
globalThis._communicator.commMgr = commMgr;
*/
