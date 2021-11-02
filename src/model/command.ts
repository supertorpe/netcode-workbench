export class Command {

    private _tick: number;
    private _playerId: number;
    private _value: number;

    constructor(tick: number, playerId: number, value: number) {
        this._tick = tick;
        this._playerId = playerId;
        this._value = value;
    }

    get tick(): number { return this._tick; }
    get playerId(): number { return this._playerId; }
    get value(): number { return this._value; }

    public clone(incTick: boolean): Command {
        return new Command(this._tick + (incTick ? 1 : 0), this._playerId, this._value);
    }

    public toString(): string {
        return `P${this._playerId}:${this._value}`;
    }

    public toFullString(): string {
        return `tick ${this._tick} P${this._playerId}:${this._value}`;
    }
}