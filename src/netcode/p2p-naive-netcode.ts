import { Command, GameState, GameStateLog } from '../model';
import { BaseNetCode } from './base-netcode';

/*
  'p2p-naive' algorithm:
  - Only track 1 GameState (the current one)
  - Every tick:
    - send the command
    - build a new GameState
*/
export class P2PNaiveNetCode extends BaseNetCode {

  private localCommand: Command | undefined;
  private localCommandDumped = false;
  private remoteCommands: Command[] = [];

  public start(initialGameState: GameState): number {
    return super.start(initialGameState);
  }

  public tick(): GameStateLog | null {
    let result = null;
    // check if a new gamestate needs to be created
    const tickBasedOnTime = this.tickBasedOnTime();
    if (tickBasedOnTime > this._currentTick) {
      // dump commands (local and remote) into the current game state
      if (!this.localCommandDumped && this.localCommand) {
        this.localCommandDumped = true;
        this._initialGameState.commands.push(this.localCommand);
      }
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
      if (this._initialGameState.commands.length < this._initialGameState.peerCount) {
        this.log.logWarn(`Waiting commands for tick ${this._currentTick}: ${this._initialGameState.commands.length} of ${this._initialGameState.peerCount}`);
      } else {
        this._initialGameState.commands.sort((a, b) => a.playerId > b.playerId ? 1 : -1);
        this.log.logInfo(this._initialGameState.toString());
        result = this._initialGameState.toLog();
        // compute next state
        this.gameStateMachine.compute(this._initialGameState);
        this._currentTick++;
        this._initialGameState.incTick();
        this._initialGameState.clearCommands();
        this.localCommand = undefined;
        this.localCommandDumped = false;
      }
    }
    return result;
  }

  localCommandReceived(playerId: number, commandValue: number): Command | undefined {
    let result;
    if (!this.localCommand) {
      result = new Command(this._currentTick, playerId, commandValue);
      this.log.logInfo(`local command: ${result.toFullString()}`);
      this.localCommand = result;
    }
    return result;
  }

  public remoteCommandReceived(command: Command): void {
    this.log.logInfo(`received command: ${command.toFullString()}`);
    this.remoteCommands.push(command);
  }

  public getGameStateToRender(): GameState {
    return this._initialGameState;
  }

  public getGameState(tick: number): GameState | null {
    if (this._initialGameState.tick === tick) return this._initialGameState;
    else return null;
  }

}