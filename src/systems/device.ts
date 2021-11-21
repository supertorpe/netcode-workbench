import { config, NetcodeConfig } from '../config';
import { NetworkConn, NetworkInterface } from './network';
import { Log } from './log';
import { EventEmitter } from './event-emitter';

import { PlanckGameState, GameStateLog } from '../model';
import { BaseNetCode, NetCodeFactory } from '../netcode';
import * as planck from 'planck-js';
import { PlanckRenderer } from './planck-renderer';
import { Renderer } from './renderer';
import { PlanckGameStateMachine } from './planck-gamestate-machine';

export class Device {

    protected running = false;
    protected _log: Log;
    protected _gameStateHistory: GameStateLog[];
    protected _networkInterface: NetworkInterface;
    protected _deviceUpdatedEmitter: EventEmitter<void> = new EventEmitter<void>();
    protected netcode!: BaseNetCode;
    protected gameStateMachine!: PlanckGameStateMachine;
    protected renderer!: Renderer;
    protected _npcs: number = 0;
    protected _interpolation: boolean = true;

    constructor(
        protected isServer: boolean,
        protected playerId: number,
        protected canvas: HTMLCanvasElement) {
        this._log = new Log();
        this._networkInterface = new NetworkInterface(this._log);
        this._gameStateHistory = [];
    }

    get log(): Log { return this._log; }
    get deviceUpdatedEmitter(): EventEmitter<void> { return this._deviceUpdatedEmitter; }
    get gameStateHistory(): GameStateLog[] { return this._gameStateHistory; }
    get interpolation(): boolean { return this._interpolation; }
    set interpolation(value: boolean) { this._interpolation = value; }
    get debugBoxes(): boolean { return this.renderer.debugBoxes; }
    set debugBoxes(value: boolean) { this.renderer.debugBoxes = value; }

    public connect(device: Device,
        minSendLatency: number, maxSendLatency: number, packetSendLoss: number,
        minReceiveLatency: number, maxReceiveLatency: number, packetReceiveLoss: number) {
        const conn1 = new NetworkConn(this.playerId, this._log);
        conn1.minLatency = minSendLatency;
        conn1.maxLatency = maxSendLatency;
        conn1.packetLoss = packetSendLoss;
        const conn2 = new NetworkConn(device.playerId, device._log);
        conn2.minLatency = minReceiveLatency;
        conn2.maxLatency = maxReceiveLatency;
        conn2.packetLoss = packetReceiveLoss;
        this._networkInterface.connect(conn1, conn2);
        device._networkInterface.connect(conn2, conn1);
    }

    public reset() {
        this._log.clear();
        this._gameStateHistory = [];
    }

    public play(
        algorithm: NetcodeConfig,
        tickMs: number,
        npcs: number,
        interpolation: boolean,
        debugBoxes: boolean) {
        // gameStateMachine
        this.gameStateMachine = new PlanckGameStateMachine(this._log, tickMs / 1000);
        // initialize netcode
        let algorithmName = algorithm.name + (algorithm.type === 'cs' ? this.isServer ? '-server' : '-client' : '');
        const netcode = NetCodeFactory.build(algorithmName, this._log, this._networkInterface, this.gameStateMachine);
        if (netcode !== null) this.netcode = netcode;
        else return;
        // npcs
        this._npcs = npcs;
        // interpolation
        this._interpolation = interpolation;
        // initialize physics world
        const world = this.createWorld();
        //  initialize game state
        const initialGameState = new PlanckGameState(0, world);
        initialGameState.peerCount = 2;
        this.netcode.tickMs = tickMs;
        this.netcode.start(initialGameState);
        // initialize renderer
        this.renderer = new PlanckRenderer(this.log, this.canvas, this.netcode);
        this.renderer.debugBoxes = debugBoxes;
        // start gameloop
        this.running = true;
        window.requestAnimationFrame(() => { this.gameLoop(); });
    }

    public stop() {
        this.running = false;
        this._networkInterface.closeConnections();
        this._networkInterface.resetEmitters();
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
        this.createStaticBody(world, 0, 0, this.canvas.width, config.physics.borderThickness);
        // - bottom
        this.createStaticBody(world, 0, this.canvas.height - config.physics.borderThickness, this.canvas.width, config.physics.borderThickness);
        // - left
        this.createStaticBody(world, 0, 0, config.physics.borderThickness, this.canvas.height);
        // - right
        this.createStaticBody(world, this.canvas.width - config.physics.borderThickness, 0, config.physics.borderThickness, this.canvas.height);
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
        for (let i = 0; i < this._npcs; i++) {
            const bodyNpc = world.createBody({
                type: "dynamic",
                position: planck.Vec2(
                    (35 + (i * size) + size / 2) / config.physics.worldScale,
                    (35 + (i * size) + size / 2) / config.physics.worldScale
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
                color: 'black'
            });
        };
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

    protected update() {
        try {
            let gamestateLog = this.netcode.tick();
            if (gamestateLog != null) {
                this._gameStateHistory.unshift(gamestateLog);
            }
        } catch(error) {
            this._log.logError(error as string);
        }
        
        this._deviceUpdatedEmitter.notify();
    }

    private draw() {
        this.renderer.render(this._interpolation);
    }
}