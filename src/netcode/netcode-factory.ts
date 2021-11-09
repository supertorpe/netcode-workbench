import { GameStateMachine } from '../model';
import { Log } from '../systems';
import { BaseNetCode } from './base-netcode';
import { NaiveNetCode } from './naive-netcode';

export class NetCodeFactory {
    constructor() { }
    public static build(algorithm: string, log: Log, gameStateMachine: GameStateMachine): BaseNetCode {
        switch (algorithm) {
            case 'naive': return new NaiveNetCode(log, gameStateMachine);
            default: return new NaiveNetCode(log, gameStateMachine);
        }
    }
}