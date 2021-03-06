import { GameStateMachine } from '../model';
import { Log, NetworkInterface } from '../systems';
import { BaseNetCode } from './base-netcode';
import { CSLockstepClientNetCode } from './client-server/cs-lockstep-client-netcode';
import { CSLockstepServerNetCode } from './client-server/cs-lockstep-server-netcode';
import { P2PNaiveNetCode } from './p2p/p2p-naive-netcode';
import { P2PDelayedNetCode } from './p2p/p2p-delayed-netcode';
import { P2PRollbackNetCode } from './p2p/p2p-rollback-netcode';
import { INetCode } from '.';

export class NetCodeFactory {
    constructor() { }
    public static build(algorithm: string, log: Log, net: NetworkInterface, gameStateMachine: GameStateMachine): BaseNetCode | null {
        switch (algorithm) {
            case 'p2p-naive':
                log.logInfo('Using p2p-naive netcode');
                return new P2PNaiveNetCode(log, net, gameStateMachine);
            case 'p2p-delayed':
                log.logInfo('Using p2p-delayed netcode');
                return new P2PDelayedNetCode(log, net, gameStateMachine);
            case 'p2p-rollback':
                log.logInfo('Using p2p-rollback netcode');
                return new P2PRollbackNetCode(log, net, gameStateMachine);
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
    public static buildFromClass(Class: INetCode, log: Log, net: NetworkInterface, gameStateMachine: GameStateMachine): BaseNetCode | null {
        return new Class(log, net, gameStateMachine);
    }
}