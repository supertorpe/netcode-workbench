import { BaseNetCode } from "../netcode";

export abstract class Renderer {

    protected context: CanvasRenderingContext2D;

    constructor(
        protected canvas: HTMLCanvasElement,
        protected netcode: BaseNetCode) {
        const context = canvas.getContext('2d');
        if (!context) throw 'error';
        this.context = context as CanvasRenderingContext2D;
    }

    public abstract render(interpolation: boolean): void;
}