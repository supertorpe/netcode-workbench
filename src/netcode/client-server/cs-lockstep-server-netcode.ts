import { Command, GameState, GameStateLog, GameStateMessage, PlanckGameState } from "../../model";
import { BaseNetCode } from "../base-netcode";

export class CSLockstepServerNetCode extends BaseNetCode {
    
    private initialGameStateSent = false;
    private remoteCommands: Command[] = [];

    public tick(): GameStateLog | null {
        let result = null;
        // broadcast the initial gamestate
        if (!this.initialGameStateSent) {
            this.initialGameStateSent = true;
            const simpleGameState = (this._initialGameState as PlanckGameState).buildSimpleGameState();
            this.log.logInfo(`sending gamestate: ${simpleGameState.toLog()}`);
            this.net.broadcast(new GameStateMessage(simpleGameState));
            result = this._initialGameState.toLog();
        }
        // check if a new gamestate needs to be created
        const tickBasedOnTime = this.tickBasedOnTime();
        if (tickBasedOnTime > this._currentTick) {
          // dump commands into the current game state
          let removed = 0;
          const remoteCommandsCount = this.remoteCommands.length;
          for (let index = 0; index < remoteCommandsCount; index++) {
            let command = this.remoteCommands[index];
            if (command && command.tick === this._initialGameState.tick) {
              this._initialGameState.commands.push(command);
              this.remoteCommands.splice(index - removed++, 1);
            }
          }
          // check if there aren't commands left
          if (this._initialGameState.commands.length < this.net.connectionCount) {
            this.log.logWarn(`Waiting commands for tick ${this._currentTick}: ${this._initialGameState.commands.length} of ${this.net.connectionCount}`);
          } else {
            this._initialGameState.commands.sort((a, b) => a.playerId > b.playerId ? 1 : -1);
            this.log.logInfo(this._initialGameState.toString());
            //result = this._initialGameState.toLog();
            // compute next state
            this.gameStateMachine.compute(this._initialGameState);
            this._currentTick++;
            this._initialGameState.incTick();
            this._initialGameState.clearCommands();
            // build and broadcast to clients a SimpleGameState
            const simpleGameState = (this._initialGameState as PlanckGameState).buildSimpleGameState();
            this.log.logInfo(`sending gamestate: ${simpleGameState.toLog()}`);
            this.net.broadcast(new GameStateMessage(simpleGameState));
            result = this._initialGameState.toLog();
          }
        }
        return result;
      }

    public localCommandReceived(_playerId: number, _commandValue: number): Command | undefined {
        throw new Error("CSLockstepServerNetCode: does not support receiving local commands");
    }
    public remoteCommandReceived(command: Command): void {
        this.log.logInfo(`received command: ${command.toFullString()}`);
        this.remoteCommands.push(command);
    }
    public gameStateReceived(_gameState: GameState): void {
        throw new Error("CSLockstepServerNetCode: does not support receiving game states");
    }
    public getGameStateToRender(): GameState {
        return this._initialGameState;
    }
    public getGameState(tick: number): GameState | null {
        if (this._initialGameState.tick === tick) return this._initialGameState;
        else return null;
    }

}