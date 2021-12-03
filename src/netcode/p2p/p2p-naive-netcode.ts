import { Command, CommandMessage, GameState, GameStateLog } from '../../model';
import { BaseNetCode } from '../base-netcode';

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

  public start(gameState: GameState): number {
    return super.start(gameState);
  }

  public tick(): GameStateLog | null {
    let result = null;
    // check if a new gamestate needs to be created
    const tickBasedOnTime = this.tickBasedOnTime();
    if (tickBasedOnTime > this._currentTick) {
      // dump commands (local and remote) into the current game state
      if (!this.localCommandDumped && this.localCommand) {
        this.localCommandDumped = true;
        this._gameState.commands.push(this.localCommand);
      }
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
      if (this._gameState.commands.length < this.net.connectionCount + 1) {
        this.log.logWarn(`Waiting commands for tick ${this._currentTick}: ${this._gameState.commands.length} of ${this.net.connectionCount + 1}`);
      } else {
        this._gameState.commands.sort((a, b) => a.playerId > b.playerId ? 1 : -1);
        this.log.logInfo(this._gameState.toString());
        result = this._gameState.toLog();
        // compute next state
        this.gameStateMachine.compute(this._gameState);
        this._currentTick++;
        this._gameState.incTick();
        this._gameState.clearCommands();
        this.localCommand = undefined;
        this.localCommandDumped = false;
      }
    }
    return result;
  }

  localCommandReceived(playerId: number, commandValue: number) {
    if (!this.localCommand) {
      const command = new Command(this._currentTick, playerId, commandValue);
      this.localCommand = command;
      this.log.logInfo(`sending local command: ${command.toFullString()}`);
      this.net.broadcast(new CommandMessage(command));
    }
  }

  public remoteCommandReceived(command: Command): void {
    this.log.logInfo(`received command: ${command.toFullString()}`);
    this.remoteCommands.push(command);
  }

  public gameStateReceived(_gameState: GameState): void {
    throw new Error('P2PNaiveNetCode: Method not implemented.');
  }

  public getGameStateToRender(): GameState {
    return this._gameState;
  }

  public getGameState(tick: number): GameState | null {
    if (this._gameState.tick === tick) return this._gameState;
    else return null;
  }

}