import { config, PlayerConfig } from "../config";
import { GameState, PlanckGameState } from "../model";
import { BaseNetCode } from "../netcode";
import { currentTimestamp } from "../utils";
import { Renderer } from "./renderer";

export class PlanckRenderer extends Renderer {

    constructor(
        protected canvas: HTMLCanvasElement,
        protected netcode: BaseNetCode) {
        super(canvas, netcode);
    }

    public render(interpolation: boolean): void {
        if (interpolation) this.renderWithInterpolation();
        else this.renderAsIs();
    }

    private renderAsIs() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const gameState = this.netcode.getGameStateToRender() as PlanckGameState;
        for (let body = gameState.world.getBodyList(); body; body = body.getNext()) {
            if (!body.getUserData()) continue;
            if (body.isStatic()) {
                this.drawStaticBody(body);
            } else {
                this.drawDynamicBody(body);
            }
        }
    }

    private renderWithInterpolation() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const gameState = this.netcode.getGameStateToRender() as PlanckGameState;
        const nextGameState = this.netcode.getGameState(gameState.tick + 1);
        const currentTime = currentTimestamp();
        const gameStateTime = this.netcode.tickTime(gameState.tick);
        const elapsed = (currentTime - gameStateTime) / 1000;
        
        for (let body = gameState.world.getBodyList(); body; body = body.getNext()) {
            if (!body.getUserData()) continue;
            if (body.isStatic()) {
                this.drawStaticBody(body);
            } else {
                this.drawDynamicBodyWithInterpolation(body, elapsed, nextGameState);
            }
        }
    }

    private drawStaticBody(body: planck.Body) {
        let width = (<any>body.getUserData()).width;
        let height = (<any>body.getUserData()).height;
        this.context.fillStyle = '#708090';
        this.context.fillRect(
            body.getPosition().x * config.physics.worldScale - width / 2,
            body.getPosition().y * config.physics.worldScale - height / 2,
            width, height);
    }

    private drawDynamicBody(body: planck.Body) {
        let player: PlayerConfig = <any>body.getUserData();
        this.context.fillStyle = player.color;
        this.context.fillRect(
            body.getPosition().x * config.physics.worldScale - player.size / 2,
            body.getPosition().y * config.physics.worldScale - player.size / 2,
            player.size, player.size);
    }

    private drawDynamicBodyWithInterpolation(body: planck.Body, elapsed: number, _nextGameState: GameState | null) {
        let player: PlayerConfig = <any>body.getUserData();
        this.context.fillStyle = player.color;
        this.context.fillRect(
            this.interpolate(elapsed, body.getPosition().x, body.getLinearVelocity().x) * config.physics.worldScale - player.size / 2,
            this.interpolate(elapsed, body.getPosition().y, body.getLinearVelocity().y) * config.physics.worldScale - player.size / 2,
            player.size, player.size);
    }

    private interpolate(time: number, pos: number, vel: number): number {
        return pos + time * vel;
    }
    
}