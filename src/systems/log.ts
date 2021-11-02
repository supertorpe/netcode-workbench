import { currentTimestamp } from "../utils";

export enum LogLevel {
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR"
}

export class Trace {
    constructor(public level: LogLevel, public timestamp: number, public text: string) { }
    public toString() : string {
        const date = new Date();
        date.setTime(this.timestamp);
        return `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}:${date.getSeconds().toString().padStart(2,'0')}.${date.getMilliseconds().toString().padStart(3,'0')} ${this.level.padEnd(5)} ${this.text}`;
    }
}

export class Log {
    private _traces: Trace[] = [];

    constructor() { }

    get traces(): Trace[] { return this._traces; }

    public log(level: LogLevel, text: string) {
        this._traces.unshift(new Trace(level, currentTimestamp(), text));
    }

    public logInfo(text: string) {
        this.log(LogLevel.INFO, text);
    }

    public logWarn(text: string) {
        this.log(LogLevel.WARN, text);
    }

    public logError(text: string) {
        this.log(LogLevel.ERROR, text);
    }

    public clear() {
        this._traces = [];
    }

    public toString(): string {
        const result = this._traces.reverse().join('\n');
        this._traces.reverse();
        return result;
    }

}