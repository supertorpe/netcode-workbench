import * as planck from 'planck-js';
//import { Serializer } from 'planck-js/lib/serializer';
import { config, PlayerConfig } from '../config';
import { CommandLog, GameState, GameStateLog, PlayerLog } from './game-state';

export class PlanckGameState extends GameState {
   
    private _world: planck.World;
    private _bodies: planck.Body[];
    
    constructor(tick: number, world: planck.World) {
        super(tick);
        this._world = world;
        this._bodies = [];
        for (let b = world.getBodyList(); b; b = b.getNext()) {
            this._bodies.unshift(b);
        }
    }

    get world(): planck.World { return this._world; }
    get bodies(): planck.Body[] { return this._bodies; }

    public toString(): string {
        let bodiesStr = '';
        this._bodies.forEach((body) => {
            if (!body.isStatic() && body.getUserData()) {
                bodiesStr += `    P${(<PlayerConfig>body.getUserData()).id} x=${body.getPosition().x * config.physics.worldScale} y=${body.getPosition().x * config.physics.worldScale}\n`;
            }
        });
        return `\nGameState tick: ${this._tick}
  bodies:
${bodiesStr}  commands:
    ${this._commands.join('\n    ')}`;
    }

    /*
        public clone(incTick: boolean, cloneWorld: boolean, cloneCommands: boolean): GameState {
            let world: planck.World;
            if (cloneWorld) {
                world = this.cloneWorld(this._world, this._bodies);
                this._bodies = [];
                for (let b = world.getBodyList(); b; b = b.getNext()) {
                    this._bodies.unshift(b);
                }
            } else {
                world = this._world;
            }
            const result = new GameState(this._tick + (incTick ? 1 : 0), world);
            if (cloneCommands) {
                this._commands.forEach(command => result.commands.push(command.clone(incTick)));
            }
            return result;
        }
    
        private cloneWorld(world: planck.World, bodies: planck.Body[]): planck.World {
            const result = Serializer.fromJson(Serializer.toJson(world)) as planck.World;
            // hack: planck serialization does not dump userData
            const resultBodies = [];
            for (let b = result.getBodyList(); b; b = b.getNext()) {
                resultBodies.unshift(b);
            }
            for (let [index, body] of resultBodies.entries()) {
                if (body === null) continue;
                body.setUserData(bodies[index].getUserData());
            }
            return result;
        }
        //*/

    public toLog(): GameStateLog {

        const players: PlayerLog[] = [];
        this._bodies.forEach((body) => {
            if (!body.isStatic() && body.getUserData()) {
                let playerConfig = <PlayerConfig>body.getUserData();
                players.push(new PlayerLog(playerConfig.id, body.getPosition().x * config.physics.worldScale, body.getPosition().y * config.physics.worldScale));
            }
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

