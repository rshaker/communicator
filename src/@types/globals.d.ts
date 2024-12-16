import { Logger } from '../logging';

declare global {
    interface Window {
        _communicator?: {
            commsMgr?: CommMgr; // Make API available to everyone, good for manual debugging
        };
    }
    // Add Logger class to global variables -- https://webpack.js.org/plugins/provide-plugin/
    // var log: Logger.log; // Works also, no function signature needed
    var log: (level: string, ...args: any[]) => void;
    var LogLevels: typeof Logger; // Uses actual Logger class to ensure all log levels stay in sync
}

// This line is important to ensure this file is treated as a module
// (required if nothing else is exported or imported by this file).
export {};
