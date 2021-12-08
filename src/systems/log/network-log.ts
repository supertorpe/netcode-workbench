import { EventEmitter } from "../../commons";

export class NetworkTrace {
    constructor(public timestamp: number, public size: number) { }
}

/* group network traffic logs into blocks of seconds */
export class NetworkLog {

    private timeIncoming = 0;
    private sizeIncoming = 0;
    private timeOutgoing = 0;
    private sizeOutgoing = 0;
    private latestTimeIncomingNotified = 0;
    private latestTimeOutgoingNotified = 0;
    
    private _outgoingEmitter: EventEmitter<NetworkTrace> = new EventEmitter<NetworkTrace>();
    private _incomingEmitter: EventEmitter<NetworkTrace> = new EventEmitter<NetworkTrace>();

    constructor() { }

    get outgoingEmitter(): EventEmitter<NetworkTrace> { return this._outgoingEmitter; }
    get incomingEmitter(): EventEmitter<NetworkTrace> { return this._incomingEmitter; }

    public logOut(timestamp: number, size: number) {
        const roundedTime = Math.floor(timestamp / 1000);
        if (this.timeOutgoing === 0) {
            this.timeOutgoing = roundedTime;
        }
        if (this.timeOutgoing !== roundedTime) {
            this.latestTimeOutgoingNotified = this.timeOutgoing;
            this._outgoingEmitter.notify(new NetworkTrace(this.timeOutgoing, this.sizeOutgoing));
            this.timeOutgoing = roundedTime;
            this.sizeOutgoing = size;
        } else {
            this.sizeOutgoing += size;
        }
    }
    public logIn(timestamp: number, size: number) {
        const roundedTime = Math.floor(timestamp / 1000);
        if (this.timeIncoming === 0) {
            this.timeIncoming = roundedTime;
        }
        if (this.timeIncoming !== roundedTime) {
            this.latestTimeIncomingNotified = this.timeIncoming;
            this._incomingEmitter.notify(new NetworkTrace(this.timeIncoming, this.sizeIncoming));
            this.timeIncoming = roundedTime;
            this.sizeIncoming = size;
        } else {
            this.sizeIncoming += size;
        }
    }

    public flush() {
        if (this.latestTimeOutgoingNotified !== this.timeOutgoing) this._outgoingEmitter.notify(new NetworkTrace(this.timeOutgoing, this.sizeOutgoing));
        if (this.latestTimeIncomingNotified !== this.timeIncoming) this._incomingEmitter.notify(new NetworkTrace(this.timeIncoming, this.sizeIncoming));
        this.timeIncoming = 0;
        this.sizeIncoming = 0;
        this.timeOutgoing = 0;
        this.sizeOutgoing = 0;
        this.latestTimeIncomingNotified = 0;
        this.latestTimeOutgoingNotified = 0;
    }

    public removeListeners() {
        this._outgoingEmitter.removeListeners();
        this._incomingEmitter.removeListeners();
    }
}