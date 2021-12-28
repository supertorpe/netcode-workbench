import { config, NetcodeConfig } from "../../config";
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
        public smoothing: string,
        public debugBoxes: boolean
        ) {
            super(algorithm, netcodeClass, tickMs, npcs, width, height, usePlanck, randomSeed);
        }
}

export class HeadedDevice extends Device {

    protected renderer!: Renderer;
    protected _smoothing: String = config.smoothing[1].name;

    constructor(
        protected isServer: boolean,
        protected playerId: number,
        protected canvas: HTMLCanvasElement) {
        super(isServer, playerId);
    }

    get debugBoxes(): boolean { return this.renderer.debugBoxes; }
    set debugBoxes(value: boolean) { this.renderer.debugBoxes = value; }
    get smoothing(): String { return this._smoothing; }
    set smoothing(value: String) { this._smoothing = value; }

    public play(cfg: HeadedDevicePlayConfig) {
        super.play(cfg);
        // smoothing
        this._smoothing = cfg.smoothing;
        // initialize renderer
        this.renderer = cfg.usePlanck ?
            new PlanckRenderer(this.log, this.canvas, this.netcode) :
            new SimpleRenderer(this.log, this.canvas, this.netcode);
        this.renderer.debugBoxes = cfg.debugBoxes;
    }

    protected draw() {
        this.renderer.render(this._smoothing);
    }

}