import { GameStateMachine } from '../model';
import { Log, NetworkInterface } from '../systems';
import { BaseNetCode } from './base-netcode';
import { CSLockstepClientNetCode } from './client-server/cs-lockstep-client-netcode';
import { CSLockstepServerNetCode } from './client-server/cs-lockstep-server-netcode';
import { P2PNaiveNetCode } from './p2p/p2p-naive-netcode';
import { P2PStibbonsNetCode } from './p2p/p2p-stibbons-netcode';

export class NetCodeFactory {
    constructor() { }
    public static build(algorithm: string, log: Log, net: NetworkInterface, gameStateMachine: GameStateMachine): BaseNetCode | null {
        switch (algorithm) {
            case 'p2p-naive':
                log.logInfo('Using p2p-naive netcode');
                return new P2PNaiveNetCode(log, net, gameStateMachine);
            case 'p2p-stibbons':
                log.logInfo('Using p2p-stibbons netcode');
                return new P2PStibbonsNetCode(log, net, gameStateMachine);
            case 'cs-lockstep-client':
                log.logInfo('Using cs-lockstep-client netcode');
                return new CSLockstepClientNetCode(log, net, gameStateMachine);
            case 'cs-lockstep-server':
                log.logInfo('Using cs-lockstep-server netcode');
                return new CSLockstepServerNetCode(log, net, gameStateMachine);
            default:
                log.logInfo(`Netcode ${algorithm} not found`);
                return null;
        }
    }
}