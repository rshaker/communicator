import { format as fmt } from "date-fns";

export class Logger {
    public static customFormatting = true;

    // Basic log levels
    public static INFO = "info";
    public static WARN = "warn";
    public static ERROR = "error";
    public static DEBUG = "debug";
    public static UNKNOWN = "unknown";

    // Custom log levels
    public static MSGS = "msgs";

    public static basicLevels: string[] = [
        Logger.INFO,
        Logger.WARN,
        Logger.ERROR,
        Logger.DEBUG,
        Logger.UNKNOWN,
    ];
    
    public static allowedLevels: string[] = [
        ...Logger.basicLevels,
        Logger.MSGS,
    ];

    // Actively printed levels
    public static activeLevels: string[] = [
        ...Logger.basicLevels,
        Logger.MSGS,
    ];

    public static format(...args: any[]): any[] {
        const newArgs: any[] = [];
        // newArgs.push(fmt(Date.now(), "MM-dd'|'HH:mm:ss.SSS"));
        newArgs.push(fmt(Date.now(), "[HH:mm:ss.SSS]"));
        newArgs.push(...args);

        return newArgs;
    }

    public static log(level: any, ...args: any[]): void {
        // Is it a recognized level?
        if (typeof level !== "string" || !Logger.allowedLevels.includes(level)) {
            args.unshift(level);
            level = Logger.UNKNOWN;
        }
        // Is it an active level?
        if (!Logger.activeLevels.includes(level)) {
            return;
        }

        if (Logger.customFormatting) {
            const newArgs = Logger.format(...args);
            switch (level) {
                case Logger.INFO:
                    console.groupCollapsed(`%c${level}`, "color: white; background-color: royalblue;", ...newArgs);
                    break;
                case Logger.WARN:
                    console.groupCollapsed(`%c${level}`, "color: black; background-color: gold;", ...newArgs);
                    break;
                case Logger.ERROR:
                    console.groupCollapsed(`%c${level}`, "color: white; background-color: firebrick;", ...newArgs);
                    break;
                case Logger.DEBUG:
                    console.groupCollapsed(`%c${level}`, "color: white; background-color: dimgray;", ...newArgs);
                    break;
                case Logger.MSGS:
                    console.groupCollapsed(`%c${level}`, "color: black; background-color: lightgreen;", ...newArgs);
                    break;
                default:
                    console.groupCollapsed(...newArgs);
            }
            console.trace();
            console.groupEnd();
        } else {
            switch (level) {
                case Logger.INFO:
                    console.info(...args);
                    break;
                case Logger.WARN:
                    console.warn(...args);
                    break;
                case Logger.ERROR:
                    console.error(...args);
                    break;
                case Logger.DEBUG:
                    console.log(...args);
                    break;
                case Logger.MSGS:
                    console.log(...args);
                    break;
                default:
                    console.log(...args);
            }
        }
    }
}
