import { GameState, GameStateMachine } from "../model";

export class Server implements GameStateMachine {


    compute(_gameState: GameState): void {
        throw new Error("Method not implemented.");
    }
    
}