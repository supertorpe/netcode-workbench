import { GameStateMachine } from '../model';
import { Log } from '../systems';
import { BaseNetCode } from './base-netcode';
import { NaiveAlg } from './naive';

export class NetCodeFactory {
    constructor() { }
    public static build(algorithm: string, log: Log, gameStateMachine: GameStateMachine): BaseNetCode {
        switch (algorithm) {
            case 'naive': return new NaiveAlg(log, gameStateMachine);
            default: return new NaiveAlg(log, gameStateMachine);
        }
    }
}