import * as planck from 'planck-js';
import { config, PlayerConfig } from '../config';
import { Command, CommandUtils } from './command';
import { CommandLog, GameState, GameStateLog, GameStateUtils, PlayerLog } from './game-state';
import { SimpleBodyState, SimpleGameState } from './simple-game-state';

export class PlanckGameState extends GameState {
    constructor(public tick: number, public commands: Command[],
        public world: planck.World,
        public bodies: planck.Body[],
        public scores: number[],
        public playerWhoCollectedTheCoin: number | undefined) {
        super(tick, commands);
    }
}

export class PlanckGameStateUtils extends GameStateUtils {

    public static extractBodies(world: planck.World): planck.Body[] {
        const result = [];
        for (let b = world.getBodyList(); b; b = b.getNext()) {
            result.unshift(b);
        }
        return result;
    }

    public static bodyFromPlayer(planckGameState: PlanckGameState, playerId: number): planck.Body | undefined {
        return planckGameState.bodies.find(body => (<PlayerConfig>body.getUserData()).id === playerId);
    }

    public static toString(planckGameState: PlanckGameState): string {
        let bodiesStr = '';
        planckGameState.bodies.forEach((body) => {
            if (!body.isStatic() && body.getUserData()) {
                const playerId = (<PlayerConfig>body.getUserData()).id;
                bodiesStr += `    P${playerId} x=${body.getPosition().x * config.physics.worldScale} y=${body.getPosition().y * config.physics.worldScale} ${playerId < 3 ? "score=" + planckGameState.scores[playerId-1] : ""}\n`;
            }
        });
        return `\nGameState tick: ${planckGameState.tick}
  bodies:
${bodiesStr}  ${planckGameState.commands.length>0?"commands:":""}
    ${CommandUtils.arrayToString(planckGameState.commands)}`;
    }

    public static toLog(planckGameState: PlanckGameState): GameStateLog {
        const players: PlayerLog[] = [];
        planckGameState.bodies.forEach((body) => {
            if (!body.isStatic() && body.getUserData()) {
                let playerConfig = <PlayerConfig>body.getUserData();
                players.push(new PlayerLog(playerConfig.id, body.getPosition().x * config.physics.worldScale, body.getPosition().y * config.physics.worldScale, planckGameState.scores[playerConfig.id-1]));
            }
        });
        players.sort((a, b) => a.id > b.id ? 1 : -1);
        const commands: CommandLog[] = [];
        planckGameState.commands.forEach((command) => {
            commands.push(new CommandLog(command.playerId, command.value));
        });
        commands.sort((a, b) => a.playerId > b.playerId ? 1 : -1);
        return new GameStateLog(planckGameState.tick, players, commands);
    }

    public static buildSimpleGameState(planckGameState: PlanckGameState) : SimpleGameState {
        const bodies: SimpleBodyState[] = [];
        planckGameState.bodies.forEach((body) => {
            if (!body.isStatic()) {
                let playerConfig = <PlayerConfig>body.getUserData();
                const simpleBody = new SimpleBodyState(
                    playerConfig.id, false,
                    body.getPosition().x, body.getPosition().y,
                    body.getLinearVelocity().x, body.getLinearVelocity().y,
                    playerConfig.size,
                    playerConfig.size,
                    playerConfig.color);
                bodies.push(simpleBody);
            }
            if (body.isStatic()) {
                const simpleBody = new SimpleBodyState(
                    -1, true,
                    body.getPosition().x, body.getPosition().y,
                    body.getLinearVelocity().x, body.getLinearVelocity().y,
                    (<any>body.getUserData()).width,
                    (<any>body.getUserData()).height,
                    (<any>body.getUserData()).color);
                bodies.push(simpleBody);
            }
        });
        return new SimpleGameState(planckGameState.tick, [], bodies, [...planckGameState.scores]);
    }
}

