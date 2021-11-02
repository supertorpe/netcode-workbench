import { Command, GameState, GameStateMachine } from "../model";
import { Log } from "../systems/log";
import { currentTimestamp } from "../utils";

export abstract class BaseNetCode {

    protected _initialGameState!: GameState;
    protected _startTime: number;
    protected _tickMs: number;
    protected _currentTick: number;

    constructor(protected log: Log, protected gameStateMachine: GameStateMachine) {
        this._startTime = 0;
        this._tickMs = 50;
        this._currentTick = 0;
    }

    get tickMs(): number { return this._tickMs; }
    set tickMs(value: number) { this._tickMs = value; }
    get currentTick(): number { return this._currentTick; }

    public start(initialGameState: GameState): void {
        this._startTime = currentTimestamp();
        this._currentTick = 0;
        this._initialGameState = initialGameState;
    }

    public tickBasedOnTime(): number {
        return Math.floor((currentTimestamp() - this._startTime) / this._tickMs);
    }

    public abstract localCommandReceived(playerId: number, commandValue: number): Command | undefined ;
    public abstract remoteCommandReceived(command: Command): void;
    public abstract getGameStateToRender(): GameState;
    public abstract tick(): void;

}