import { NetcodeConfig } from '../../config';
import { NetworkConn, NetworkInterface } from '../network';
import { Log, NetworkLog } from '../log';
import { EventEmitter, RepeatableRandomizer } from '../../commons';
import { GameStateLog, GameStateMachine } from '../../model';
import { BaseNetCode, INetCode, NetCodeFactory } from '../../netcode';
import { PlanckGameStateMachine, SimpleGameStateMachine } from '../gamestate-machine';
import { SerializerFactory } from '../serializers';

export class DevicePlayConfig {
    constructor(public algorithm: NetcodeConfig,
        public netcodeClass: INetCode | null,
        public tickMs: number,
        public npcs: number,
        public width: number,
        public height: number,
        public usePlanck: boolean,
        public randomSeed: number[]) { }
}

export class Device {

    protected running = false;
    protected _log: Log;
    protected _gameStateHistory: GameStateLog[];
    protected _networkInterface: NetworkInterface;
    protected _networkListenersAttached = false;
    protected _deviceUpdatedEmitter: EventEmitter<void> = new EventEmitter<void>();
    protected netcode!: BaseNetCode;
    protected gameStateMachine!: GameStateMachine;

    constructor(
        protected isServer: boolean,
        protected playerId: number) {
        this._log = new Log();
        this._networkInterface = new NetworkInterface();
        this._gameStateHistory = [];
    }

    get log(): Log { return this._log; }
    get trafficLog(): NetworkLog { return this._networkInterface.trafficLog; }
    get deviceUpdatedEmitter(): EventEmitter<void> { return this._deviceUpdatedEmitter; }
    get gameStateHistory(): GameStateLog[] { return this._gameStateHistory; }

    public init() {
        if (!this._networkListenersAttached) {
            this._networkListenersAttached = true;
            this._networkInterface.connectionEmitter.addEventListener((peer) => {
                if (peer.peerId === 0) {
                    this.log.logInfo(`Connected to Server`);
                } else {
                    this.log.logInfo(`Connected to Player ${peer.peerId}`);
                }
            });
            this._networkInterface.disconnectionEmitter.addEventListener((peer) => {
                if (peer.peerId === 0) {
                    this.log.logInfo(`Disconnected from Server`);
                } else {
                    this.log.logInfo(`Disconnected from Player ${peer.peerId}`);
                }
            });
        }
    }

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

    public play(config: DevicePlayConfig) {
        // gameStateMachine
        this.gameStateMachine = (
            config.usePlanck ?
            new PlanckGameStateMachine(this._log, config.tickMs / 1000, config.width, config.height, config.npcs, new RepeatableRandomizer(config.randomSeed)) :
            new SimpleGameStateMachine()
        );
        // initialize netcode
        let netcode: BaseNetCode | null;
        if (config.netcodeClass === null) {
            const algorithmName = config.algorithm.name + (config.algorithm.type === 'cs' ? this.isServer ? '-server' : '-client' : '');
            netcode = NetCodeFactory.build(algorithmName, this._log, this._networkInterface, this.gameStateMachine);
        } else {
            netcode = NetCodeFactory.buildFromClass(config.netcodeClass, this.log, this._networkInterface, this.gameStateMachine);
        }
        if (netcode !== null)
            this.netcode = netcode;
        else
            return;
        this.netcode.tickMs = config.tickMs;
        this.netcode.gamestateLogEmitter.addEventListener((gamestateLog) => {
            const index = this._gameStateHistory.findIndex((gsLog) => gsLog.tick === gamestateLog.tick);
            if (index == -1) {
                this._gameStateHistory.unshift(gamestateLog);
            } else {
                this._gameStateHistory[index] = gamestateLog;
            }
        });
        // build initial game state
        const initialGameState = this.gameStateMachine.buildInitialGameState();
        // start netcode
        this.netcode.start(initialGameState);
        // start gameloop
        this.running = true;
        window.requestAnimationFrame(() => { this.gameLoop(); });
    }

    public stop() {
        this.running = false;
        if (this.netcode) this.netcode.gamestateLogEmitter.removeListeners();
        this._networkInterface.trafficLog.flush();
        this._networkInterface.trafficLog.removeListeners();
        this._networkInterface.closeConnections();
        this._networkInterface.removeListeners();
        this._networkListenersAttached = false;
        
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
        try {
            this.update();
            this.draw();
        } catch(error) {
            this._log.logError(error as string);
        }
    }

    protected update() {
        this.netcode.tick();
        this._deviceUpdatedEmitter.notify();
    }

    protected draw() { }
}