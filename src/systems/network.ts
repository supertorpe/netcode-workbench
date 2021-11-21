import { Message } from '../model';
import { EventEmitter } from './event-emitter';
import { currentTimestamp, randomInt } from '../utils';
import { Log } from './log';

export class NetworkInterface {
    private connections: NetworkConn[] = [];
    private _connectionEmitter: EventEmitter<NetworkConn> = new EventEmitter<NetworkConn>();
    private _disconnectionEmitter: EventEmitter<NetworkConn> = new EventEmitter<NetworkConn>();
    private _messageSentEmitter: EventEmitter<Message> = new EventEmitter<Message>();
    private _messageReceivedEmitter: EventEmitter<Message> = new EventEmitter<Message>();

    get connectionEmitter(): EventEmitter<NetworkConn> { return this._connectionEmitter; }
    get disconnectionEmitter(): EventEmitter<NetworkConn> { return this._disconnectionEmitter; }
    get messageSentEmitter(): EventEmitter<Message> { return this._messageSentEmitter; }
    get messageReceivedEmitter(): EventEmitter<Message> { return this._messageReceivedEmitter; }

    constructor(private log: Log) { }

    public connect(localConn: NetworkConn, remoteConn: NetworkConn) {
        this.attachListeners(localConn);
        this.connections.push(localConn);
        localConn.connect(remoteConn);
        if (remoteConn.peerId === 0) {
            this.log.logInfo(`Connected to Server`);
        } else {
            this.log.logInfo(`Connected to Player ${remoteConn.peerId}`);
        }
    }

    private attachListeners(connection: NetworkConn) {
        connection.connectionEmitter.addEventListener((conn) => {
            this._connectionEmitter.notify(conn);
        });
        connection.disconnectionEmitter.addEventListener((conn) => {
            this._disconnectionEmitter.notify(conn);
        });
        connection.messageReceivedEmitter.addEventListener((message) => {
            this._messageReceivedEmitter.notify(message);
        });
        connection.messageSentEmitter.addEventListener((message) => {
            this._messageSentEmitter.notify(message);
        });
    }

    private findConnection(peerId: number): NetworkConn | undefined {
        return this.connections.find(conn => conn.peer.peerId === peerId);
    }

    public closeConnections() {
        this.connections.forEach((conn) => {
            if (conn.peer.peerId === 0) {
                this.log.logInfo(`Disconnected from Server`);
            } else {
                this.log.logInfo(`Disconnected from Player ${conn.peer.peerId}`);
            }
            this._disconnectionEmitter.notify(conn);
        });
        this.connections = [];
    }

    public resetEmitters() {
        this._connectionEmitter.removeListeners();
        this._disconnectionEmitter.removeListeners();
        this._messageSentEmitter.removeListeners();
        this._messageReceivedEmitter.removeListeners();
    }

    public broadcast(message: Message) {
        this.connections.forEach((conn) => { conn.send(message); });
    }

    public send(peerId: number, message: Message) {
        this.findConnection(peerId)?.send(message);
    }
}

export class NetworkConn {

    private _peer!: NetworkConn;
    private _minLatency: number = 0;
    private _maxLatency: number = 0;
    private _packetLoss: number = 0;
    private _totalSent: number = 0;
    private _totalLost: number = 0;
    private _connectionEmitter: EventEmitter<NetworkConn> = new EventEmitter<NetworkConn>();
    private _disconnectionEmitter: EventEmitter<NetworkConn> = new EventEmitter<NetworkConn>();
    private _messageSentEmitter: EventEmitter<Message> = new EventEmitter<Message>();
    private _messageReceivedEmitter: EventEmitter<Message> = new EventEmitter<Message>();

    constructor(public peerId: number, private log: Log) { }

    get connectionEmitter(): EventEmitter<NetworkConn> { return this._connectionEmitter; }
    get disconnectionEmitter(): EventEmitter<NetworkConn> { return this._disconnectionEmitter; }
    get messageSentEmitter(): EventEmitter<Message> { return this._messageSentEmitter; }
    get messageReceivedEmitter(): EventEmitter<Message> { return this._messageReceivedEmitter; }

    get peer(): NetworkConn { return this._peer; }

    set minLatency(value: number) { this._minLatency = value; }
    set maxLatency(value: number) { this._maxLatency = value; }
    set packetLoss(value: number) { this._packetLoss = value; }

    public connect(peer: NetworkConn) {
        this._peer = peer;
        this._connectionEmitter.notify(peer);
    }

    public send(message: Message) {
        message.timestampOrigin = currentTimestamp();
        message.origin = this.peerId;
        message.destination = this._peer.peerId;
        if (this._packetLoss > 0) {
            if (this._totalLost + 1 < this._totalSent * this._packetLoss / 100) {
                this.log.logWarn(`Message for tick ${message.tick} lost`);
                this._totalLost++;
                return;
            }
        }
        this._totalSent++;
        this._messageSentEmitter.notify(message);
        if (this.maxLatency === 0) {
            this._peer.receive(message);
        } else {
            setTimeout(() => {
                this._peer.receive(message);
            }, randomInt(this._minLatency, this._maxLatency));
        }
    }

    public receive(message: Message) {
        message.timestampDestination = currentTimestamp();
        this._messageReceivedEmitter.notify(message);
    }

}

