import { Command } from "./command";
import { GameState } from "./game-state";

export class Message {
    
    public static KIND_COMMAND = 'CMD';
    public static KIND_GAMESTATE = 'GST';
    public static KIND_UNDEFINED = '';
    public kind: string = Message.KIND_UNDEFINED;
    public timestampOrigin!: number;
    public timestampDestination!: number;

    constructor(public tick: number, public origin?: number, public destination?: number) { }

}

export class CommandMessage extends Message {

    public command: Command;

    constructor(command: Command, origin?: number, destination?: number) {
        super(command.tick, origin, destination);
        this.kind = Message.KIND_COMMAND;
        this.command = command;
    }

}

export class GameStateMessage extends Message {

    public gameState: GameState;

    constructor(gameState: GameState, origin?: number, destination?: number) {
        super(gameState.tick, origin, destination);
        this.kind = Message.KIND_GAMESTATE;
        this.gameState = gameState;
    }

}