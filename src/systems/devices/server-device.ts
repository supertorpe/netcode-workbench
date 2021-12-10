import { HeadedDevice } from "./headed-device";

export class ServerDevice extends HeadedDevice {
    constructor(
        protected playerId: number,
        protected canvas: HTMLCanvasElement) {
        super(true, playerId, canvas);
    }
}