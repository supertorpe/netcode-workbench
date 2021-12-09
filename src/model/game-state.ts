import { Command } from "./command";

export class PlayerLog {
    constructor(public id: number, public x: number, public y: number, public score: number) { }
    public toString(): string {
        return `P${this.id} x=${this.x} y=${this.y} score=${this.score}`;
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
  ${this.commands.length>0?"Commands:":""} ${this.commands.join(' ')}`;
    }
}

export class GameState {
    constructor(public tick: number, public commands: Command[]) { }
}

export abstract class GameStateUtils {

    public static incTick(gameState: GameState) {
        gameState.tick++;
    }

    public static commandFromPlayer(gameState: GameState, playerId: number): Command | undefined {
        return gameState.commands.find(command => command.playerId === playerId);
    }

    public static clearCommands(gameState: GameState) {
        gameState.commands = [];
    }

}

export interface GameStateMachine {
    buildInitialGameState(): GameState;
    compute(gameState: GameState): void;
}
