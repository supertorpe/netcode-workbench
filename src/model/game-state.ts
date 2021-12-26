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
        public commands: CommandLog[],
        public mismatches: boolean = false) { }
    public toString(): string {
        return `tick: ${this.tick}
  ${this.players.join('\n  ')}
  ${this.commands.length>0?"Commands:":""} ${this.commands.join(' ')}`;
    }
    public equals(other: GameStateLog, compareCommands: boolean) {
        if (compareCommands && this.commands.length !== other.commands.length) {
            return false;
        }
        if (this.players.length !== other.players.length) {
            return false;
        }
        if (compareCommands && this.commands.some((mycmd) => {
            let othercmd = other.commands.find((cmd) => cmd.playerId === mycmd.playerId);
            return !othercmd || othercmd.value != mycmd.value;
        })) {
            return false;
        }
        if (this.players.some((myplayer) => {
            let otherplayer = other.players.find((ply) => ply.id === myplayer.id);
            return !otherplayer || otherplayer.x != myplayer.x || otherplayer.y != myplayer.y || otherplayer.score != myplayer.score;
        })) {
            return false;
        }
        return true;
    }
}

export class GameState {
    constructor(public tick: number, public commands: Command[], public randomPointer: number) { }
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
