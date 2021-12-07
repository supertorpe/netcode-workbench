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
    
    private _outgoingEmitter: EventEmitter<NetworkTrace> = new EventEmitter<NetworkTrace>();
    private _incomingEmitter: EventEmitter<NetworkTrace> = new EventEmitter<NetworkTrace>();

    constructor() { }

    get outgoingEmitter(): EventEmitter<NetworkTrace> { return this._outgoingEmitter; }
    get incomingEmitter(): EventEmitter<NetworkTrace> { return this._incomingEmitter; }

    public logOut(timestamp: number, size: number) {
        if (size === 0) return;
        const roundedTime = Math.floor(timestamp / 1000);
        if (this.timeOutgoing === 0) {
            this.timeOutgoing = roundedTime;
        }
        if (this.sizeOutgoing > 0 && this.timeOutgoing != roundedTime) {
            this._outgoingEmitter.notify(new NetworkTrace(this.timeOutgoing, this.sizeOutgoing));
            this.timeOutgoing = roundedTime;
            this.sizeOutgoing = 0;
        } else {
            this.sizeOutgoing += size;
        }
    }
    public logIn(timestamp: number, size: number) {
        if (size === 0) return;
        const roundedTime = Math.floor(timestamp / 1000);
        if (this.timeIncoming === 0) {
            this.timeIncoming = roundedTime;
        }
        if (this.sizeIncoming > 0 && this.timeIncoming != roundedTime) {
            this._incomingEmitter.notify(new NetworkTrace(this.timeIncoming, this.sizeIncoming));
            this.timeIncoming = roundedTime;
            this.sizeIncoming = 0;
        } else {
            this.sizeIncoming += size;
        }
    }

    public removeListeners() {
        if (this.sizeOutgoing > 0)
            this._outgoingEmitter.notify(new NetworkTrace(this.timeOutgoing, this.sizeOutgoing));
        if (this.sizeIncoming > 0)
            this._incomingEmitter.notify(new NetworkTrace(this.timeIncoming, this.sizeIncoming));

        this._outgoingEmitter.removeListeners();
        this._incomingEmitter.removeListeners();
    }
}