import { Command, GameState } from "../../model";
import { BaseNetCode } from "../base-netcode";

export class CSLockstepClientNetCode extends BaseNetCode {

    public localCommandReceived(_playerId: number, _commandValue: number): Command | undefined {
        throw new Error("Method not implemented.");
    }
    public remoteCommandReceived(_command: Command): void {
        throw new Error("Method not implemented.");
    }
    public getGameStateToRender(): GameState {
        throw new Error("Method not implemented.");
    }
    public getGameState(_tick: number): GameState | null {
        throw new Error("Method not implemented.");
    }
    public tick(): void {
        throw new Error("Method not implemented.");
    }
}