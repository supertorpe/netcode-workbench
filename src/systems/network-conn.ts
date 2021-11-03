import { Command } from '../model';
import { EventEmitter } from './event-emitter';
import { randomInt } from '../utils';

export class Message {
    constructor(public playerId: number, public command: Command) { }
}

export class NetworkConn {

    private _peers: NetworkConn[] = [];
    private _minLatency: number = 0;
    private _maxLatency: number = 0;
    private _commandSentEmitter: EventEmitter<Message> = new EventEmitter<Message>();
    private _commandReceivedEmitter: EventEmitter<Message> = new EventEmitter<Message>();

    constructor(public playerId: number) { }

    get commandSentEmitter(): EventEmitter<Message> { return this._commandSentEmitter; }
    get commandReceivedEmitter(): EventEmitter<Message> { return this._commandReceivedEmitter; }

    set minLatency(value: number) { this._minLatency = value; }
    set maxLatency(value: number) { this._maxLatency = value; }

    public connect(peer: NetworkConn) {
        this._peers.push(peer);
    }

    public closeConnections() {
        this._peers = [];
    }

    public broadcast(command: Command) {
        this._peers.forEach((peer) => {
            this._commandSentEmitter.notify(new Message(peer.playerId, command));
            if (this.maxLatency === 0) {
                peer.receive(this, command);
            } else {
                setTimeout(() => {
                    peer.receive(this, command);
                }, randomInt(this._minLatency, this._maxLatency));
            }
        });
    }

    public send(peer: NetworkConn, command: Command) {
        this._commandSentEmitter.notify(new Message(peer.playerId, command));
        if (this.maxLatency === 0) {
            peer.receive(this, command);
        } else {
            setTimeout(() => {
                peer.receive(this, command);
            }, randomInt(this._minLatency, this._maxLatency));
        }
    }

    public receive(peer: NetworkConn, command: Command) {
        this._commandReceivedEmitter.notify(new Message(peer.playerId, command));
    }

}

