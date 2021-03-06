import { Command, CommandMessage, GameState, GameStateLog, GameStateMachine, GameStateMessage, Message } from '../model';
import { Log, NetworkInterface } from '../systems';
import { currentTimestamp } from '../commons/utils';
import { EventEmitter } from '../commons';

export interface INetCode {
    new (log: Log, net: NetworkInterface, gameStateMachine: GameStateMachine) : BaseNetCode;
    get tickMs(): number;
    set tickMs(value: number);
    start(gameState?: GameState): number;
    tick(): void;
    tickBasedOnTime(): number;
    tickTime(tick: number): number;
    localCommandReceived(playerId: number, commandValue: number): void;
    remoteCommandReceived(command: Command): void;
    gameStateReceived(gameState: GameState): void;
    getGameStateToRender(): GameState;
    getGameState(tick: number): GameState | undefined;
}

export abstract class BaseNetCode {

    protected _gameState!: GameState;
    protected _startTime: number;
    protected _tickMs: number;
    protected _currentTick: number;
    protected _gamestateLogEmitter: EventEmitter<GameStateLog> = new EventEmitter<GameStateLog>();

    constructor(protected log: Log, protected net: NetworkInterface, protected gameStateMachine: GameStateMachine) {
        this._startTime = 0;
        this._tickMs = 50;
        this._currentTick = 0;
        this.net.messageReceivedEmitter.addEventListener((message) => {
            if (message.kind === Message.KIND_COMMAND)
                this.remoteCommandReceived((message as CommandMessage).command);
            else if (message.kind === Message.KIND_GAMESTATE)
                this.gameStateReceived((message as GameStateMessage).gameState);
            else
                this.log.logError(`Unknown message received: ${message}`);
        });
    }

    get tickMs(): number { return this._tickMs; }
    set tickMs(value: number) { this._tickMs = value; }
    get currentTick(): number { return this._currentTick; }
    get gamestateLogEmitter(): EventEmitter<GameStateLog> { return this._gamestateLogEmitter; }

    public start(gameState?: GameState): number {
        this._startTime = currentTimestamp();
        this._currentTick = 0;
        if (gameState) this._gameState = gameState;
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
    public abstract getGameState(tick: number): GameState | undefined;
    public abstract tick(): void;

}