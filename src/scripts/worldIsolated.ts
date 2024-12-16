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

    // Periodically add a random letter to the object store
    // const ppm = new MessagingProvider(commMgr, { storeName: "test" }); 
    // intervalId = setInterval(async () => {
    //     const result = await ppm.add({ 
    //         data: String.fromCharCode(65 + Math.floor(Math.random() * 26)),
    //     });
    // }, 3000);
}

function commMgrHandler(message: CommMsg) {
    console.log(`Handled message from ${message?.fromContext} in ${detectContext()}`, message);
}

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

install();
*/

/*
// This block contains an alternative way to inject a script into the page context that works in Firefox.

function injectPageScript(scriptName: string) {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL(`scripts/${scriptName}`);
    script.type = "text/javascript";
    script.async = false;
    (document.head || document.documentElement).appendChild(script);
    script.onload = () => script.remove();
}

// Inject worldMain.js into the page context if running in Firefox
if (navigator.userAgent.includes("Firefox")) {
    injectPageScript("worldMain.js");
}
*/