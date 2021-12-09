import { Command, CommandUtils, CommandMessage, GameState, GameStateLog, PlanckGameState, PlanckGameStateUtils } from '../../model';
import { PlanckGameStateMachine } from '../../systems/gamestate-machine';
import { BaseNetCode } from '../base-netcode';

/*
  'p2p-delayed' algorithm:
  - Tracks 2 GameStates
  - Every tick:
    - send the command
    - build a new GameState
*/
export class P2PDelayedNetCode extends BaseNetCode {

  private localCommand: Command | undefined;
  private localCommandDumped = false;
  private remoteCommands: Command[] = [];
  private prevGameState: GameState | undefined;

  public start(gameState: GameState): number {
    this.prevGameState = gameState;
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
        const planckGameState = this._gameState as PlanckGameState;
        this.log.logInfo(PlanckGameStateUtils.toString(planckGameState));
        result = PlanckGameStateUtils.toLog(planckGameState);
        // compute next state
        this.prevGameState = (this.gameStateMachine as PlanckGameStateMachine).clone(planckGameState);
        this.gameStateMachine.compute(this._gameState);
        this._currentTick++;
        PlanckGameStateUtils.incTick(this._gameState);
        PlanckGameStateUtils.clearCommands(this._gameState);
        this.localCommand = undefined;
        this.localCommandDumped = false;
      }
    }
    return result;
  }

  localCommandReceived(playerId: number, commandValue: number): void {
    if (!this.localCommand) {
      const command = new Command(this._currentTick, playerId, commandValue);
      this.localCommand = command;
      this.log.logInfo(`sending local command: ${CommandUtils.toFullString(command)}`);
      this.net.broadcast(new CommandMessage(command));
    }
  }

  public remoteCommandReceived(command: Command): void {
    this.log.logInfo(`received command: ${CommandUtils.toFullString(command)}`);
    this.remoteCommands.push(command);
  }
  
  public gameStateReceived(_gameState: GameState): void {
    throw new Error('P2PDelayedNetCode: Method not implemented.');
  }

  public getGameStateToRender(): GameState {
    return (this.prevGameState ? this.prevGameState : this._gameState);
  }

  public getGameState(tick: number): GameState | null {
    if (this._gameState.tick === tick)
      return this._gameState;
    else if (this.prevGameState && this.prevGameState.tick === tick)
      return this.prevGameState;
    else
      return null;
  }

}