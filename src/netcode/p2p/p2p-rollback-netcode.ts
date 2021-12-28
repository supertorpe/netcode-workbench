import { CONSTS, PlayerConfig } from '../../config';
import { Command, CommandUtils, CommandMessage, GameState, PlanckGameState, PlanckGameStateUtils } from '../../model';
import { PlanckGameStateMachine } from '../../systems/gamestate-machine';
import { BaseNetCode } from '../base-netcode';

/*
  'p2p-rollback' algorithm
*/
export class P2PRollbackNetCode extends BaseNetCode {

  private localCommand: Command | undefined;
  private latestCommandValueSent = CONSTS.COMMAND_NONE;
  private remoteCommands: Command[] = [];
  private gameStateHistory: GameState[] = [];
  
  public start(gameState: GameState): number {
    // initialize commands
    gameState.commands = [];
    const gs = gameState as PlanckGameState;
    gs.bodies.forEach((body) => {
      if (!body.isStatic() && body.getUserData()) {
        gameState.commands.push(new Command(0, (<PlayerConfig>body.getUserData()).id, CONSTS.COMMAND_NONE, true));
      }
    });
    this.gameStateHistory.push(gameState);
    return super.start(gameState);
  }

  public tick(): void {
    // while a new gamestate needs to be created
    while (this.tickBasedOnTime() > this.gameStateHistory[this.gameStateHistory.length - 1].tick) {
      let latestGameState = this.gameStateHistory[this.gameStateHistory.length - 1] as PlanckGameState;
      this._currentTick = latestGameState.tick + 1;
      this.log.logInfo(`Starting tick ${this._currentTick}`);
      // dump local command into the current game state
      if (this.localCommand && this.localCommand.tick === latestGameState.tick) {
        const command = latestGameState.commands.find(cmd => cmd.playerId === this.localCommand?.playerId);
        if (!command || (command.cloned && command.value !== this.localCommand.value)) {
          if (!command) {
            latestGameState.commands.push(this.localCommand);
          } else {
            command.cloned = false;
            command.value = this.localCommand.value;
          }
        }
      }
      let historyRewritten = false;
      // load remote commands into gameStates and check if history needs to be rewritten
      let rewriteHistoryFrom = this.loadCommandsIntoGameStates();
      if (rewriteHistoryFrom && rewriteHistoryFrom.tick < this._currentTick - 1) {
          this.rewriteHistory(rewriteHistoryFrom);
          historyRewritten = true;
      }
      // log
      this.notifyGameStateLog(latestGameState, false);
      // compute next state
      if (!historyRewritten) {
        const newGameState = this.computeNextGameState(latestGameState);
        this.gameStateHistory.push(newGameState);
      }
    }
    this.cleanup();
  }

  private cleanup() {
    // clean old gameHistory
    while (this.gameStateHistory.length > 100) {
      const gameState = this.gameStateHistory[0] as PlanckGameState;
      const worldToDestroy = gameState.world;
      if (worldToDestroy) {
        for (let b = worldToDestroy.getBodyList(); b; b = b.getNext()) {
          worldToDestroy.destroyBody(b);
        }
      }
      this.gameStateHistory.shift();
    }
  }

  private notifyGameStateLog(gameState: PlanckGameState, rewritting: boolean) {
    gameState.commands.sort((a, b) => a.playerId > b.playerId ? 1 : -1);
    this.log.logInfo(`${rewritting ? 'RW' : ''} ${PlanckGameStateUtils.toString(gameState)}`);
    this._gamestateLogEmitter.notify(PlanckGameStateUtils.toLog(gameState));
  }

  private loadCommandsIntoGameStates(): GameState | undefined {
    let rewriteHistoryFromTick;
    const historyLength = this.gameStateHistory.length;
    const firstTick = this.gameStateHistory[0].tick;
    const remoteCommandsSize = this.remoteCommands.length;
    let removed = 0;
    for (let index = 0; index < remoteCommandsSize; index++) {
        let item = this.remoteCommands[index - removed];
        this.log.logInfo(`evaluating command ${CommandUtils.toString(item)}`);
        if (item.tick >= firstTick && item.tick < firstTick + historyLength) {
            let gameState = this.gameStateHistory[item.tick - firstTick];
            const command = gameState.commands.find(cmd => cmd.playerId === item.playerId);
            let valueChanged = false;
            if (!command) {
              this.log.logInfo(`push command ${CommandUtils.toString(item)} into gameState ${gameState.tick}`);
              gameState.commands.push(item);
              valueChanged = true;
            } else {
              command.cloned = false;
              if (command.value !== item.value) {
                this.log.logInfo(`update command ${CommandUtils.toString(command)} from value ${command.value} to value ${item.value} into gameState ${gameState.tick}`);
                command.value = item.value;
                valueChanged = true;
              }
            }
            if (valueChanged && (!rewriteHistoryFromTick || rewriteHistoryFromTick > item.tick))
                rewriteHistoryFromTick = item.tick;
            this.remoteCommands.splice(index - removed++, 1);
        }
    }
    return rewriteHistoryFromTick
        ? this.gameStateHistory[rewriteHistoryFromTick - firstTick]
        : undefined;
  }

  private rewriteHistory(gameState: GameState) {
    this.log.logInfo(`rewrite history from gameState ${gameState.tick}`);
    let index = this.gameStateHistory.findIndex((gs) => gs.tick === gameState.tick);
    let tick = gameState.tick;
    while (index >= 0 && index < this.gameStateHistory.length - 1) {
      let gs = this.gameStateHistory[index];
      this.log.logInfo(`rewriting gameState ${tick++}`);
      this.notifyGameStateLog(gs as PlanckGameState, true);
      const commands = this.gameStateHistory[index + 1].commands;
      let gsNext = this.computeNextGameState(gs as PlanckGameState);
      this.gameStateHistory[index + 1] = gsNext;
      gsNext.commands = commands;
      // clone commands
      gs.commands.forEach((cmd) => {
        const command = gsNext.commands.find((nextCmd) => nextCmd.playerId === cmd.playerId);
        if (!command || (command.cloned && command.value !== cmd.value)) {
          if (!command) {
            gsNext.commands.push(CommandUtils.clone(cmd, true));
          } else {
            command.cloned = true;
            command.value = cmd.value;
          }
        }
      });
      this.notifyGameStateLog(gsNext as PlanckGameState, true);
      index++;
    }
  }

  private computeNextGameState(prevGameState: PlanckGameState): GameState {
    let result = (this.gameStateMachine as PlanckGameStateMachine).clone(prevGameState);
    PlanckGameStateUtils.incTick(result);
    this.gameStateMachine.compute(result);
    return result;
  }

  localCommandReceived(playerId: number, commandValue: number): void {
    if ((!this.localCommand || this.localCommand.tick !== this._currentTick) && this.latestCommandValueSent !== commandValue) {
      this.latestCommandValueSent = commandValue;
      const command = new Command(this._currentTick, playerId, commandValue, false);
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
    return (this.gameStateHistory.length > 1 ? this.gameStateHistory[this.gameStateHistory.length - 2] : this.gameStateHistory[this.gameStateHistory.length - 1]);
  }

  public getGameState(tick: number): GameState | undefined {
    return this.gameStateHistory.find(gs => gs.tick === tick);
  }

}