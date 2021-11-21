import { Device } from "./device";

export class ServerDevice extends Device {
    constructor(
        protected playerId: number,
        protected canvas: HTMLCanvasElement) {
        super(true, playerId, canvas);
    }
}