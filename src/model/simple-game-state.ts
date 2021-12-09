import { Command, CommandUtils } from './command';
import { config } from '../config';
import { CommandLog, GameState, GameStateLog, PlayerLog } from './game-state';

export class SimpleBodyState {
    constructor(
        public id: number, public isStatic: boolean,
        public posX: number, public posY: number,
        public velX: number, public velY: number,
        public width: number, public height: number,
        public color: string) { }
}

export class SimpleBodyStateUtils {
    public static clone(simpleBodyState: SimpleBodyState) : SimpleBodyState {
        return new SimpleBodyState(
            simpleBodyState.id, simpleBodyState.isStatic,
            simpleBodyState.posX, simpleBodyState.posY,
            simpleBodyState.velX, simpleBodyState.velY,
            simpleBodyState.width, simpleBodyState.height,
            simpleBodyState.color);
    }
}

export class SimpleGameState extends GameState {
    constructor(public tick: number, public commands: Command[], public bodies: SimpleBodyState[], public scores: number[]) {
        super(tick, commands);
    }
}

export class SimpleGameStateUtils {

    public static bodyFromPlayer(simpleGameState: SimpleGameState, playerId: number): SimpleBodyState | undefined {
        return simpleGameState.bodies.find(body => body.id === playerId);
    }

    public static toString(simpleGameState: SimpleGameState): string {
        let bodiesStr = '';
        simpleGameState.bodies.forEach((body) => {
            if (!body.isStatic)
                bodiesStr += `    P${body.id} x=${body.posX * config.physics.worldScale} y=${body.posY * config.physics.worldScale}\n`;
        });
        return `\nGameState tick: ${simpleGameState.tick}
  bodies:
${bodiesStr}  ${simpleGameState.commands.length>0?"commands    ":""}${CommandUtils.arrayToString(simpleGameState.commands)}`;
    }

    public static clone(simpleGameState: SimpleGameState): GameState {
        const bodies: SimpleBodyState[] = [];
        simpleGameState.bodies.forEach((body) => { bodies.push(SimpleBodyStateUtils.clone(body)); });
        const result = new SimpleGameState(simpleGameState.tick, CommandUtils.cloneArray(simpleGameState.commands), simpleGameState.bodies, [...simpleGameState.scores]);
        return result;
    }

    public static toLog(simpleGameState: SimpleGameState): GameStateLog {
        const players: PlayerLog[] = [];
        simpleGameState.bodies.forEach((body) => {
            if (!body.isStatic)
                players.push(new PlayerLog(body.id, body.posX * config.physics.worldScale, body.posY * config.physics.worldScale, simpleGameState.scores[body.id-1]));
        });
        players.sort((a, b) => a.id > b.id ? 1 : -1);
        const commands: CommandLog[] = [];
        simpleGameState.commands.forEach((command) => {
            commands.push(new CommandLog(command.playerId, command.value));
        });
        commands.sort((a, b) => a.playerId > b.playerId ? 1 : -1);
        return new GameStateLog(simpleGameState.tick, players, commands);
    }
}

