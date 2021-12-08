import { NetcodeConfig } from '../../config';
import { NetworkConn, NetworkInterface } from '../network';
import { Log, NetworkLog } from '../log';
import { EventEmitter } from '../../commons';
import { GameStateLog, GameStateMachine } from '../../model';
import { BaseNetCode, INetCode, NetCodeFactory } from '../../netcode';
import { Renderer, PlanckRenderer, SimpleRenderer } from '../renderers';
import { PlanckGameStateMachine, SimpleGameStateMachine } from '../gamestate-machine';
import { SerializerFactory } from '../serializers';

export class Device {

    protected running = false;
    protected _log: Log;
    protected _gameStateHistory: GameStateLog[];
    protected _networkInterface: NetworkInterface;
    protected _deviceUpdatedEmitter: EventEmitter<void> = new EventEmitter<void>();
    protected netcode!: BaseNetCode;
    protected gameStateMachine!: GameStateMachine;
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
    get trafficLog(): NetworkLog { return this._networkInterface.trafficLog; }
    get deviceUpdatedEmitter(): EventEmitter<void> { return this._deviceUpdatedEmitter; }
    get gameStateHistory(): GameStateLog[] { return this._gameStateHistory; }
    get interpolation(): boolean { return this._interpolation; }
    set interpolation(value: boolean) { this._interpolation = value; }
    get debugBoxes(): boolean { return this.renderer.debugBoxes; }
    set debugBoxes(value: boolean) { this.renderer.debugBoxes = value; }

    public connect(device: Device, serializerName: string,
        minSendLatency: number, maxSendLatency: number, packetSendLoss: number,
        minReceiveLatency: number, maxReceiveLatency: number, packetReceiveLoss: number) {
        const conn1 = new NetworkConn(this._networkInterface, this.playerId, this._log, SerializerFactory.build(serializerName, this.log));
        conn1.minLatency = minSendLatency;
        conn1.maxLatency = maxSendLatency;
        conn1.packetLoss = packetSendLoss;
        const conn2 = new NetworkConn(device._networkInterface, device.playerId, device._log, SerializerFactory.build(serializerName, device.log));
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
        netcodeClass: INetCode | null,
        tickMs: number,
        npcs: number,
        usePlanck: boolean, 
        interpolation: boolean,
        debugBoxes: boolean) {
        // gameStateMachine
        this.gameStateMachine = (
            usePlanck ?
            new PlanckGameStateMachine(this._log, tickMs / 1000, this.canvas.width, this.canvas.height, this._npcs) :
            new SimpleGameStateMachine()
        );
        // initialize netcode
        let netcode: BaseNetCode | null;
        if (netcodeClass === null) {
            const algorithmName = algorithm.name + (algorithm.type === 'cs' ? this.isServer ? '-server' : '-client' : '');
            netcode = NetCodeFactory.build(algorithmName, this._log, this._networkInterface, this.gameStateMachine);
        } else {
            netcode = NetCodeFactory.buildFromClass(netcodeClass, this.log, this._networkInterface, this.gameStateMachine);
        }
        if (netcode !== null)
            this.netcode = netcode;
        else
            return;
        this.netcode.tickMs = tickMs;
        // npcs
        this._npcs = npcs;
        // interpolation
        this._interpolation = interpolation;
        // build initial game state
        const initialGameState = this.gameStateMachine.buildInitialGameState();
        // initialize renderer
        this.renderer = usePlanck ?
            new PlanckRenderer(this.log, this.canvas, this.netcode) :
            new SimpleRenderer(this.log, this.canvas, this.netcode);
        this.renderer.debugBoxes = debugBoxes;
        // start netcode
        this.netcode.start(initialGameState);
        // start gameloop
        this.running = true;
        window.requestAnimationFrame(() => { this.gameLoop(); });
    }

    public stop() {
        this.running = false;
        this._networkInterface.removeListeners();
        this._networkInterface.closeConnections();
        this._networkInterface.trafficLog.flush();
        this._networkInterface.trafficLog.removeListeners();
    }

    public gameStateHistoryLog(): string {
        const result = this._gameStateHistory.reverse().join('\n');
        this._gameStateHistory.reverse();
        return result;
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