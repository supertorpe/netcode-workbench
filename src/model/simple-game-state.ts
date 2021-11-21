import { config } from '../config';
import { CommandLog, GameState, GameStateLog, PlayerLog } from './game-state';

export class SimpleBodyState {
    constructor(public id: number, public posX: number, public posY: number) { }
    public clone() : SimpleBodyState {
        return new SimpleBodyState(this.id, this.posX, this.posY);
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

