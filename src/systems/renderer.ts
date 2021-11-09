import { BaseNetCode } from "../netcode";
import { Log } from "./log";

export abstract class Renderer {

    protected context: CanvasRenderingContext2D;
    protected _debugBoxes: boolean = true;

    constructor(
        protected log: Log,
        protected canvas: HTMLCanvasElement,
        protected netcode: BaseNetCode) {
        const context = canvas.getContext('2d');
        if (!context) throw 'Error getting context 2d';
        this.context = context as CanvasRenderingContext2D;
    }

    get debugBoxes(): boolean { return this._debugBoxes; }
    set debugBoxes(value: boolean) { this._debugBoxes = value; }

    public abstract render(interpolation: boolean): void;
}