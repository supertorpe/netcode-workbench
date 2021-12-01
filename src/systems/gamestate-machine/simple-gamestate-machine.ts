import { GameState, GameStateMachine, SimpleGameState } from "../../model";

export class SimpleGameStateMachine implements GameStateMachine {

    constructor() { }

    buildInitialGameState(): GameState {
        return new SimpleGameState(0, []);
    }

    compute(_gs: GameState): void { }
    
}