import { CONSTS } from "../../config";
import { HeadedDevice } from "./headed-device";
import { input } from '../input/input';

export class ClientDevice extends HeadedDevice {
    constructor(
        protected playerId: number,
        protected keyUp: number,
        protected keyDown: number,
        protected keyLeft: number,
        protected keyRight: number,
        protected canvas: HTMLCanvasElement) {
            super(false, playerId, canvas);
    }

    protected update() {
        const vertical = input.isPressed(this.keyUp) ? CONSTS.COMMAND_UP : input.isPressed(this.keyDown) ? CONSTS.COMMAND_DOWN : CONSTS.COMMAND_NONE;
        const horizontal = input.isPressed(this.keyLeft) ? CONSTS.COMMAND_LEFT : input.isPressed(this.keyRight) ? CONSTS.COMMAND_RIGHT : CONSTS.COMMAND_NONE;
        const commandValue = vertical + horizontal;
        this.netcode.localCommandReceived(this.playerId, commandValue);
        super.update();
    }
}