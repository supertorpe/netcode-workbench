import { config, CONSTS, PlayerConfig } from "../config";
import { GameState, GameStateMachine, PlanckGameState } from "../model";
import { Log } from "./log";
import * as planck from 'planck-js';

export class PlanckGameStateMachine implements GameStateMachine {

    constructor(private log: Log, private step: number) { }

    compute(gs: GameState): void {
        const gameState = gs as PlanckGameState;
        // apply commands to players
        for (let command of gameState.commands) {
            if (!command || command.value === CONSTS.COMMAND_NONE) continue;
            const body = gameState.bodies.find(body => (body.getUserData() ? (<PlayerConfig>body.getUserData()).id : -1) == command.playerId);
            if (body) {
                const forceX = (command.value == CONSTS.COMMAND_RIGHT || command.value == CONSTS.COMMAND_DOWN_RIGHT || command.value == CONSTS.COMMAND_UP_RIGHT
                    ? config.physics.strength
                    : command.value == CONSTS.COMMAND_LEFT || command.value == CONSTS.COMMAND_DOWN_LEFT || command.value == CONSTS.COMMAND_UP_LEFT
                        ? -1 * config.physics.strength
                        : 0);
                const forceY = (command.value == CONSTS.COMMAND_DOWN || command.value == CONSTS.COMMAND_DOWN_LEFT || command.value == CONSTS.COMMAND_DOWN_RIGHT
                    ? config.physics.strength
                    : command.value == CONSTS.COMMAND_UP || command.value == CONSTS.COMMAND_UP_LEFT || command.value == CONSTS.COMMAND_UP_RIGHT
                        ? -1 * config.physics.strength
                        : 0);
                this.log.logInfo(`apply command value ${command.value} to P${command.playerId}: force(x=${forceX} y=${forceY})`);
                body.applyForce(planck.Vec2(forceX, forceY), body.getWorldCenter());
            }
        }
        gameState.world.step(this.step);
        gameState.world.clearForces();
    }
    
}