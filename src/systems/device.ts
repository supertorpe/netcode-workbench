import { config, PlayerConfig } from '../config';
import { Message, NetworkConn } from './network-conn';
import { Log } from './log';
import { EventEmitter } from './event-emitter';
import { input } from './input';
import { GameState, GameStateLog, GameStateMachine } from '../model';
import { BaseNetCode, NetCodeFactory } from '../netcode';
import * as planck from 'planck-js';

const CONSTS = {
    COMMAND_NONE: 0,

    COMMAND_UP: 1,
    COMMAND_DOWN: 2,
    COMMAND_LEFT: 10,
    COMMAND_RIGHT: 20,

    COMMAND_UP_LEFT: 11,
    COMMAND_UP_RIGHT: 21,
    COMMAND_DOWN_LEFT: 12,
    COMMAND_DOWN_RIGHT: 22
};

export class Device implements GameStateMachine {

    private running = false;
    private _log: Log;
    private _gameStateHistory : GameStateLog[];
    private _networkConn: NetworkConn;
    private _canvas: HTMLCanvasElement;
    private _context: CanvasRenderingContext2D | null;
    private _deviceUpdatedEmitter: EventEmitter<void> = new EventEmitter<void>();
    private netcode!: BaseNetCode;

    constructor(
        private playerId: number,
        private keyUp: number,
        private keyDown: number,
        private keyLeft: number,
        private keyRight: number,
        canvas: HTMLCanvasElement) {
        this._log = new Log();
        this._networkConn = new NetworkConn(playerId);
        this._networkConn.commandReceivedEmitter.addEventListener((message) => {
            this.messageReceived(message);
        });
        this._canvas = canvas;
        this._context = canvas.getContext('2d');
        this._gameStateHistory = [];
    }

    get log(): Log { return this._log; }
    get deviceUpdatedEmitter(): EventEmitter<void> { return this._deviceUpdatedEmitter; }
    get gameStateHistory(): GameStateLog[] { return this._gameStateHistory; }

    public connect(device: Device) {
        this._log.logInfo(`Connected to player ${device.playerId}`);
        this._networkConn.connect(device._networkConn);
    }

    public reset() {
        this._log.clear();
        this._gameStateHistory = [];
        this._networkConn.closeConnections();
    }

    public play(algorithm: string, tickMs: number, minLatency: number, maxLatency: number) {
        // network latency
        this._networkConn.minLatency = minLatency;
        this._networkConn.maxLatency = maxLatency;
        // initialize physics world
        const world = this.createWorld();
        //  initialize game state
        const initialGameState = new GameState(0, world);
        initialGameState.peerCount = 2;
        // initialize netcode
        this.netcode = NetCodeFactory.build(algorithm, this._log, this);
        this.netcode.tickMs = tickMs;
        this.netcode.start(initialGameState);
        // start gameloop
        this.running = true;
        window.requestAnimationFrame(() => { this.gameLoop(); });
    }

    public pause() {
        this.running = false;
    }

    public gameStateHistoryLog(): string {
        const result = this._gameStateHistory.reverse().join('\n');
        this._gameStateHistory.reverse();
        return result;
    }

    private createStaticBody(world: planck.World, x: number, y: number, width: number, height: number) {
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

    private createWorld(): planck.World {
        const gravity = planck.Vec2(0, 0);
        const world = planck.World(gravity);
        // borders
        // - top
        this.createStaticBody(world, 0, 0, this._canvas.width, config.physics.borderThickness);
        // - bottom
        this.createStaticBody(world, 0, this._canvas.height - config.physics.borderThickness, this._canvas.width, config.physics.borderThickness);
        // - left
        this.createStaticBody(world, 0, 0, config.physics.borderThickness, this._canvas.height);
        // - right
        this.createStaticBody(world, this._canvas.width - config.physics.borderThickness, 0, config.physics.borderThickness, this._canvas.height);
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
        return world;
    }

    private gameLoop() {
        if (!this.running) {
            return;
        }
        window.requestAnimationFrame(() => { this.gameLoop(); });
        this.update();
        this.draw();
    }

    private update() {
        const vertical = input.isPressed(this.keyUp) ? CONSTS.COMMAND_UP : input.isPressed(this.keyDown) ? CONSTS.COMMAND_DOWN : CONSTS.COMMAND_NONE;
        const horizontal = input.isPressed(this.keyLeft) ? CONSTS.COMMAND_LEFT : input.isPressed(this.keyRight) ? CONSTS.COMMAND_RIGHT : CONSTS.COMMAND_NONE;
        const commandValue = vertical + horizontal;
        const command = this.netcode.localCommandReceived(this.playerId, commandValue);
        if (command) {
            this.log.logInfo(`sending command: ${command.toFullString()}`);
            this._networkConn.broadcast(command);
        }
        let gamestateLog = this.netcode.tick();
        if (gamestateLog != null) {
            this._gameStateHistory.unshift(gamestateLog);
        }
        this._deviceUpdatedEmitter.notify();
    }

    private draw() {
        if (!this._context) return;
        const context: CanvasRenderingContext2D = this._context;
        context.clearRect(0, 0, this._canvas.width, this._canvas.height);
        const gameState = this.netcode.getGameStateToRender();
        for (let body = gameState.world.getBodyList(); body; body = body.getNext()) {
            if (!body.getUserData()) continue;
            if (body.isStatic()) {
                let width = (<any>body.getUserData()).width;
                let height = (<any>body.getUserData()).height;
                context.fillStyle = '#708090';
                context.fillRect(
                    body.getPosition().x * config.physics.worldScale - width / 2,
                    body.getPosition().y * config.physics.worldScale - height / 2,
                    width, height);
            
            } else {
                let player: PlayerConfig = <any>body.getUserData();
                context.fillStyle = player.color;
                context.fillRect(
                    body.getPosition().x * config.physics.worldScale - player.size / 2,
                    body.getPosition().y * config.physics.worldScale - player.size / 2,
                    player.size, player.size);
            }
        }
    }

    public compute(gameState: GameState): void {
        // apply commands to players
        for (let command of gameState.commands) {
            if (!command || command.value === CONSTS.COMMAND_NONE) continue;
            const body = gameState.bodies.find(body => (body.getUserData() ? (<PlayerConfig>body.getUserData()).id : -1 ) == command.playerId);
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
        gameState.world.step(this.netcode.tickMs / 1000);
        gameState.world.clearForces();
    }

    private messageReceived(message: Message) {
        this.netcode.remoteCommandReceived(message.command);
    }

}