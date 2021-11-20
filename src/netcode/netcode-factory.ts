import { GameStateMachine } from '../model';
import { Log } from '../systems';
import { BaseNetCode } from './base-netcode';
import { P2PNaiveNetCode } from './p2p-naive-netcode';
import { P2PStibbonsNetCode } from './p2p-stibbons-netcode';

export class NetCodeFactory {
    constructor() { }
    public static build(algorithm: string, log: Log, gameStateMachine: GameStateMachine): BaseNetCode | null {
        switch (algorithm) {
            case 'p2p-naive':
                log.logInfo('Using p2p-naive netcode');
                return new P2PNaiveNetCode(log, gameStateMachine);
            case 'p2p-stibbons':
                log.logInfo('Using p2p-stibbons netcode');
                return new P2PStibbonsNetCode(log, gameStateMachine);
            default:
                log.logInfo(`Netcode ${algorithm} not found`);
                return null;
        }
    }
}