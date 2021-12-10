import { CONSTS } from "../../config";
import { Device } from "./device";
import { currentTimestamp, randomInt } from "../../commons";

export class NPCDevice extends Device {

    private lastCommandTime = 0;
    private commandValue = CONSTS.COMMAND_NONE;

    constructor(protected playerId: number) {
        super(false, playerId);
    }

    protected update() {
        if (this.lastCommandTime === 0 || currentTimestamp() > this.lastCommandTime + 1000) {
            const vertical = randomInt(0,1) ? CONSTS.COMMAND_UP : randomInt(0,1) ? CONSTS.COMMAND_DOWN : CONSTS.COMMAND_NONE;
            const horizontal = randomInt(0,1) ? CONSTS.COMMAND_LEFT : randomInt(0,1) ? CONSTS.COMMAND_RIGHT : CONSTS.COMMAND_NONE;
            this.commandValue = vertical + horizontal;
        }
        this.netcode.localCommandReceived(this.playerId, this.commandValue);
        super.update();
    }
}