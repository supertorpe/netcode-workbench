import { config } from '../config';
import { CommandLog, GameState, GameStateLog, PlayerLog } from './game-state';

export class SimpleBodyState {
    constructor(
        public id: number, public isStatic: boolean,
        public posX: number, public posY: number,
        public velX: number, public velY: number,
        public width: number, public height: number,
        public color: string) { }
    
    public clone() : SimpleBodyState {
        return new SimpleBodyState(
            this.id, this.isStatic,
            this.posX, this.posY,
            this.velX, this.velY,
            this.width, this.height,
            this.color);
    }
}

export class SimpleGameState extends GameState {

    private _bodies: SimpleBodyState[];

    constructor(tick: number, bodies: SimpleBodyState[]) {
        super(tick);
        this._bodies = bodies;
    }

    get bodies(): SimpleBodyState[] { return this._bodies; }

    public bodyFromPlayer(playerId: number): SimpleBodyState | undefined {
        return this._bodies.find(body => body.id === playerId);
    }

    public toString(): string {
        let bodiesStr = '';
        this._bodies.forEach((body) => {
            if (!body.isStatic)
                bodiesStr += `    P${body.id} x=${body.posX * config.physics.worldScale} y=${body.posY * config.physics.worldScale}\n`;
        });
        return `\nGameState tick: ${this._tick}
  bodies:
${bodiesStr}  commands:
    ${this._commands.join('\n    ')}`;
    }

    public clone(): GameState {
        const bodies: SimpleBodyState[] = [];
        this._bodies.forEach((body) => { bodies.push(body.clone()); });
        const result = new SimpleGameState(this._tick, this._bodies);
        this._commands.forEach(command => result.commands.push(command.clone(false)));
        return result;
    }

    public toLog(): GameStateLog {
        const players: PlayerLog[] = [];
        this._bodies.forEach((body) => {
            if (!body.isStatic)
                players.push(new PlayerLog(body.id, body.posX * config.physics.worldScale, body.posY * config.physics.worldScale));
        });
        players.sort((a, b) => a.id > b.id ? 1 : -1);
        const commands: CommandLog[] = [];
        this._commands.forEach((command) => {
            commands.push(new CommandLog(command.playerId, command.value));
        });
        commands.sort((a, b) => a.playerId > b.playerId ? 1 : -1);
        return new GameStateLog(this._tick, players, commands);
    }
}

