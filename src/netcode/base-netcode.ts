import { Command, CommandMessage, GameState, GameStateMachine, GameStateMessage } from '../model';
import { Log, NetworkInterface } from '../systems';
import { currentTimestamp } from '../commons/utils';

export abstract class BaseNetCode {

    protected _initialGameState!: GameState;
    protected _startTime: number;
    protected _tickMs: number;
    protected _currentTick: number;

    constructor(protected log: Log, protected net: NetworkInterface, protected gameStateMachine: GameStateMachine) {
        this._startTime = 0;
        this._tickMs = 50;
        this._currentTick = 0;
        this.net.messageReceivedEmitter.addEventListener((message) => {
            if (message instanceof CommandMessage)
                this.remoteCommandReceived((message as CommandMessage).command);
            else if (message instanceof GameStateMessage)
                this.gameStateReceived((message as GameStateMessage).gameState);
            else
                this.log.logError(`Unknown message received: ${message}`);
        });
    }

    get tickMs(): number { return this._tickMs; }
    set tickMs(value: number) { this._tickMs = value; }
    get currentTick(): number { return this._currentTick; }

    public start(initialGameState?: GameState): number {
        this._startTime = currentTimestamp();
        this._currentTick = 0;
        if (initialGameState) this._initialGameState = initialGameState;
        return this._startTime;
    }

    public tickBasedOnTime(): number {
        return Math.floor((currentTimestamp() - this._startTime) / this._tickMs);
    }

    public tickTime(tick: number): number {
        return this._startTime + (tick * this.tickMs);
    }

    public abstract localCommandReceived(playerId: number, commandValue: number): void;
    public abstract remoteCommandReceived(command: Command): void;
    public abstract gameStateReceived(gameState: GameState): void;
    public abstract getGameStateToRender(): GameState;
    public abstract getGameState(tick: number): GameState | null;
    public abstract tick(): void;

}