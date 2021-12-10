import { NetcodeConfig } from "../../config";
import { INetCode } from "../../netcode";
import { PlanckRenderer, Renderer, SimpleRenderer } from "../renderers";
import { Device, DevicePlayConfig } from "./device";

export class HeadedDevicePlayConfig extends DevicePlayConfig {
    constructor(public algorithm: NetcodeConfig,
        public netcodeClass: INetCode | null,
        public tickMs: number,
        public npcs: number,
        public width: number,
        public height: number,
        public usePlanck: boolean,
        public randomSeed: number[],
        public interpolation: boolean,
        public debugBoxes: boolean
        ) {
            super(algorithm, netcodeClass, tickMs, npcs, width, height, usePlanck, randomSeed);
        }
}

export class HeadedDevice extends Device {

    protected renderer!: Renderer;
    protected _interpolation: boolean = true;

    constructor(
        protected isServer: boolean,
        protected playerId: number,
        protected canvas: HTMLCanvasElement) {
        super(isServer, playerId);
    }

    get debugBoxes(): boolean { return this.renderer.debugBoxes; }
    set debugBoxes(value: boolean) { this.renderer.debugBoxes = value; }
    get interpolation(): boolean { return this._interpolation; }
    set interpolation(value: boolean) { this._interpolation = value; }

    public play(config: HeadedDevicePlayConfig) {
        super.play(config);
        // interpolation
        this._interpolation = config.interpolation;
        // initialize renderer
        this.renderer = config.usePlanck ?
            new PlanckRenderer(this.log, this.canvas, this.netcode) :
            new SimpleRenderer(this.log, this.canvas, this.netcode);
        this.renderer.debugBoxes = config.debugBoxes;
    }

    protected draw() {
        this.renderer.render(this._interpolation);
    }

}