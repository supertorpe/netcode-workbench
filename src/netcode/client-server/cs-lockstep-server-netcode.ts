import { Command, CommandUtils, GameState, GameStateLog, GameStateMessage, PlanckGameState, PlanckGameStateUtils, SimpleGameStateUtils } from "../../model";
import { BaseNetCode } from "../base-netcode";

export class CSLockstepServerNetCode extends BaseNetCode {
    
    private initialGameStateSent = false;
    private remoteCommands: Command[] = [];

    public tick(): GameStateLog | null {
        let result = null;
        // broadcast the initial gamestate
        if (!this.initialGameStateSent) {
            this.initialGameStateSent = true;
            const simpleGameState = PlanckGameStateUtils.buildSimpleGameState(this._gameState as PlanckGameState);
            this.log.logInfo(`sending gamestate: ${SimpleGameStateUtils.toLog(simpleGameState)}`);
            this.net.broadcast(new GameStateMessage(simpleGameState));
            result = PlanckGameStateUtils.toLog(this._gameState as PlanckGameState);
        }
        // check if a new gamestate needs to be created
        const tickBasedOnTime = this.tickBasedOnTime();
        if (tickBasedOnTime > this._currentTick) {
          // dump commands into the current game state
          let removed = 0;
          const remoteCommandsCount = this.remoteCommands.length;
          for (let index = 0; index < remoteCommandsCount; index++) {
            let command = this.remoteCommands[index];
            if (command && command.tick === this._gameState.tick) {
              this._gameState.commands.push(command);
              this.remoteCommands.splice(index - removed++, 1);
            }
          }
          // check if there aren't commands left
          if (this._gameState.commands.length < this.net.connectionCount) {
            this.log.logWarn(`Waiting commands for tick ${this._currentTick}: ${this._gameState.commands.length} of ${this.net.connectionCount}`);
          } else {
            this._gameState.commands.sort((a, b) => a.playerId > b.playerId ? 1 : -1);
            this.log.logInfo(PlanckGameStateUtils.toString(this._gameState as PlanckGameState));
            result = PlanckGameStateUtils.toLog(this._gameState as PlanckGameState);
            // compute next state
            this.gameStateMachine.compute(this._gameState);
            this._currentTick++;
            PlanckGameStateUtils.incTick(this._gameState);
            PlanckGameStateUtils.clearCommands(this._gameState);
            // build and broadcast a SimpleGameState to clients
            const simpleGameState = PlanckGameStateUtils.buildSimpleGameState(this._gameState as PlanckGameState);
            this.log.logInfo(`sending gamestate: ${SimpleGameStateUtils.toLog(simpleGameState)}`);
            this.net.broadcast(new GameStateMessage(simpleGameState));
          }
        }
        return result;
      }

    public localCommandReceived(_playerId: number, _commandValue: number): Command | undefined {
        throw new Error("CSLockstepServerNetCode: does not support receiving local commands");
    }
    public remoteCommandReceived(command: Command): void {
        this.log.logInfo(`received command: ${CommandUtils.toFullString(command)}`);
        this.remoteCommands.push(command);
    }
    public gameStateReceived(_gameState: GameState): void {
        throw new Error("CSLockstepServerNetCode: does not support receiving game states");
    }
    public getGameStateToRender(): GameState {
        return this._gameState;
    }
    public getGameState(tick: number): GameState | null {
        if (this._gameState.tick === tick) return this._gameState;
        else return null;
    }

}