import { Command, CommandMessage, GameState, GameStateLog } from "../../model";
import { BaseNetCode } from "../base-netcode";

export class CSLockstepClientNetCode extends BaseNetCode {

    private localCommandTick = -1;
    private lastTickReturned = -1;

    public tick(): GameStateLog | null {
        let result = null;
        if (this.lastTickReturned < this._currentTick && this._initialGameState) {
            this.lastTickReturned = this._currentTick;
            this.log.logInfo(this._initialGameState.toString());
            result = this._initialGameState.toLog();
        }
        return result;
    }

    public localCommandReceived(playerId: number, commandValue: number): void {
        if (this.localCommandTick < this._currentTick) {
            this.localCommandTick = this._currentTick;
            const command = new Command(this._currentTick, playerId, commandValue);
            this.log.logInfo(`sending local command: ${command.toFullString()}`);
            this.net.broadcast(new CommandMessage(command));
          }
    }

    public remoteCommandReceived(_command: Command): void {
        throw new Error("CSLockstepClientNetCode: does not support receiving remote commands");
    }

    public gameStateReceived(gameState: GameState): void {
        this.log.logInfo(`received gamestate: ${gameState.toLog()}`);
        if (gameState.tick < this._currentTick) {
            this.log.logInfo(`ignoring old gamestate: ${gameState.tick}`);
            return;
        }
        this._initialGameState = gameState;
        this._currentTick = gameState.tick;
    }

    public getGameStateToRender(): GameState {
        return this._initialGameState;
    }

    public getGameState(tick: number): GameState | null {
        if (this._initialGameState.tick === tick) return this._initialGameState;
        else return null;
    }

}