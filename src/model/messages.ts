import { Command } from "./command";

export class Message {
    private _timestampOrigin!: number;
    private _timestampDestination!: number;

    constructor(public tick: number, public origin?: number, public destination?: number) { }

    get timestampOrigin(): number { return this._timestampOrigin; }
    set timestampOrigin(value: number) { this._timestampOrigin = value; }
    get timestampDestination(): number { return this._timestampDestination; }
    set timestampDestination(value: number) { this._timestampDestination = value; }
}

export class CommandMessage extends Message {

    private _command: Command;

    constructor(command: Command, origin?: number, destination?: number) {
        super(command.tick, origin, destination);
        this._command = command;
    }

    get command(): Command { return this._command; }

}