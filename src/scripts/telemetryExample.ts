import { CommMgr, CommMsg } from "../communication";
import { detectContext, BrowserContextType } from "@rshaker/context-detect";

const commMgr = CommMgr.getInstance<CommMsg>();
commMgr.addListener((msg: CommMsg) => { 
    console.log(`message received from context: ${msg.fromContext}, payload: ${msg.payload}`);
});

const currentContext = detectContext();
if (currentContext === BrowserContextType.MAIN_WORLD) {
    // Report mouse coordinates to the background context
    document.addEventListener('mousemove', ({ clientX, clientY }) => {
        const msg: CommMsg = {
            type: "ping",
            id: "pointer-coordinates",
            toContext: BrowserContextType.BACKGROUND_WORKER,
            payload: { 
                entry: { clientX, clientY, timestamp: Date.now() },
            },
        };
        commMgr.sendMessage(msg);
    });
} else if (currentContext === BrowserContextType.BACKGROUND_WORKER) {
    commMgr.addListener((msg: CommMsg) => {
        if (msg.type === "ping" && msg.id === "pointer-coordinates") {
            console.log("Pointer coordinates received:", msg.payload.entry);
        }
    });
}
