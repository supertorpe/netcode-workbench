import { Command } from "./command";

export class PlayerLog {
    constructor(public id: number, public x: number, public y: number) { }
    public toString(): string {
        return `P${this.id} x=${this.x} y=${this.y}`;
    }
}
export class CommandLog {
    constructor(public playerId: number, public value: number) { }
    public toString(): string {
        return `P${this.playerId}:${this.value}`;
    }
}
export class GameStateLog {
    constructor(
        public tick: number,
        public players: PlayerLog[],
        public commands: CommandLog[]) { }
    public toString(): string {
        return `tick: ${this.tick}
  ${this.players.join('\n  ')}
  Commands: ${this.commands.join(' ')}`;
    }
}

export abstract class GameState {
    
    protected _tick: number;
    protected _commands: Command[];

    constructor(tick: number) {
        this._tick = tick;
        this._commands = [];
    }

    get tick(): number { return this._tick; }
    get commands(): Command[] { return this._commands; }

    public incTick() {
        this._tick++;
    }

    public commandFromPlayer(playerId: number): Command | undefined {
        return this._commands.find(command => command.playerId === playerId);
    }

    public clearCommands() {
        this._commands = [];
    }

    public abstract toLog(): GameStateLog;

    public abstract clone(): GameState;

}

export interface GameStateMachine {
    buildInitialGameState(): GameState;
    compute(gameState: GameState): void;
}
