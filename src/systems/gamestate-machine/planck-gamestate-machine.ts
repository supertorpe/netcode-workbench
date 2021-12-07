import { config, CONSTS, PlayerConfig } from "../../config";
import { GameState, GameStateMachine, PlanckGameState, PlanckGameStateUtils } from "../../model";
import { Log } from "../log/log";
import * as planck from 'planck-js';

export class PlanckGameStateMachine implements GameStateMachine {

    constructor(private log: Log, private step: number,
        private canvasWidth: number, private canvasHeight: number, private npcs: number) { }

    buildInitialGameState(): GameState {
        const world = this.createPlanckWorld();
        const bodies = PlanckGameStateUtils.extractBodies(world);
        return new PlanckGameState(0, [], world, bodies);
    }

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

    
    private createPlanckStaticBody(world: planck.World, x: number, y: number, width: number, height: number) {
        const body = world.createBody({ type: "static" });
        body.setUserData({
            width: width,
            height: height
        });
        body.createFixture(
            planck.Box(
                width / 2 / config.physics.worldScale,
                height / 2 / config.physics.worldScale)
        );
        body.setPosition(
            planck.Vec2(
                (x + width / 2) / config.physics.worldScale,
                (y + height / 2) / config.physics.worldScale)
        );
    }

    private createPlanckWorld(): planck.World {
        const gravity = planck.Vec2(0, 0);
        const world = planck.World(gravity);
        // borders
        // - top
        this.createPlanckStaticBody(world, 0, 0, this.canvasWidth, config.physics.borderThickness);
        // - bottom
        this.createPlanckStaticBody(world, 0, this.canvasHeight - config.physics.borderThickness, this.canvasWidth, config.physics.borderThickness);
        // - left
        this.createPlanckStaticBody(world, 0, 0, config.physics.borderThickness, this.canvasHeight);
        // - right
        this.createPlanckStaticBody(world, this.canvasWidth - config.physics.borderThickness, 0, config.physics.borderThickness, this.canvasHeight);
        // players
        const playerFD = {
            density: 0.0,
            restitution: 0.4
        };
        config.players.forEach((player) => {
            const plyr = world.createBody({
                type: "dynamic",
                position: planck.Vec2(
                    (player.x + player.size / 2) / config.physics.worldScale,
                    (player.y + player.size / 2) / config.physics.worldScale
                ),
                allowSleep: false,
                awake: true
            });
            plyr.createFixture(
                planck.Box(player.size / 2 / config.physics.worldScale, player.size / 2 / config.physics.worldScale),
                playerFD
            );
            plyr.setUserData(player);
        });
        // NPCs
        const npcFD = {
            density: 0.0,
            restitution: 1
        };
        let size = 20;
        for (let i = 0; i < this.npcs; i++) {
            const bodyNpc = world.createBody({
                type: "dynamic",
                position: planck.Vec2(
                    (35 + (i * size) + size / 2 + (10 - this.npcs) * 8) / config.physics.worldScale,
                    (35 + (i * size) + size / 2 + (10 - this.npcs) * 8) / config.physics.worldScale
                ),
                allowSleep: false,
                awake: true
            });
            bodyNpc.createFixture(
                planck.Box(size / 2 / config.physics.worldScale, size / 2 / config.physics.worldScale),
                npcFD
            );
            bodyNpc.setUserData({
                id: 100 + i,
                size: size,
                color: config.npc.color
            });
        };
        return world;
    }
    
}