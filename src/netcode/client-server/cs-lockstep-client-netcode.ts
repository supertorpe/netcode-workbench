import { Command, CommandUtils, CommandMessage, GameState, GameStateLog, SimpleGameState, SimpleGameStateUtils } from "../../model";
import { BaseNetCode } from "../base-netcode";

export class CSLockstepClientNetCode extends BaseNetCode {

    private localCommandTick = -1;
    private lastTickReturned = -1;

    public tick(): GameStateLog | null {
        let result = null;
        if (this.lastTickReturned < this._currentTick && this._gameState) {
            this.lastTickReturned = this._currentTick;
            this.log.logInfo(SimpleGameStateUtils.toString(this._gameState as SimpleGameState));
            result = SimpleGameStateUtils.toLog(this._gameState as SimpleGameState);
        }
        return result;
    }

    public localCommandReceived(playerId: number, commandValue: number): void {
        if (this.localCommandTick < this._currentTick) {
            this.localCommandTick = this._currentTick;
            const command = new Command(this._currentTick, playerId, commandValue);
            this.log.logInfo(`sending local command: ${CommandUtils.toFullString(command)}`);
            this.net.broadcast(new CommandMessage(command));
          }
    }

    public remoteCommandReceived(_command: Command): void {
        throw new Error("CSLockstepClientNetCode: does not support receiving remote commands");
    }

    public gameStateReceived(gameState: GameState): void {
        this.log.logInfo(`received gamestate: ${SimpleGameStateUtils.toLog(this._gameState as SimpleGameState)}`);
        if (gameState.tick < this._currentTick) {
            this.log.logInfo(`ignoring old gamestate: ${gameState.tick}`);
            return;
        }
        this._gameState = gameState;
        this._currentTick = gameState.tick;
    }

    public getGameStateToRender(): GameState {
        return this._gameState;
    }

    public getGameState(tick: number): GameState | null {
        if (this._gameState.tick === tick) return this._gameState;
        else return null;
    }

}