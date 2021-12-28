import { config, CONSTS, PlayerConfig } from "../../config";
import { PlanckGameState, PlanckGameStateUtils } from "../../model";
import { BaseNetCode } from "../../netcode";
import { currentTimestamp, Vector } from "../../commons";
import { Log } from "../log";
import { Renderer } from "./renderer";

class InterpolationInfo {
    constructor(
        public currentTime: number,
        public currentGameState: PlanckGameState,
        public currentGameStateTime: number,
        public elapsed: number,
        public nextGameState: PlanckGameState | undefined,
        public nextGameStateTime: number | undefined,
        public nextElapsed: number,
        public tickTimeDiff: number,
        public maxDisplacement: number
    ) { }
}

export class PlanckRenderer extends Renderer {

    private renderedPositions: Map<number, Vector>;

    constructor(
        protected log: Log,
        protected canvas: HTMLCanvasElement,
        protected netcode: BaseNetCode) {
        super(log, canvas, netcode);
        this.renderedPositions = new Map<number, Vector>();
    }

    public render(smoothing: String): void {
        if (smoothing !== 'none') this.renderWithInterpolation(smoothing === 'progressive' ? CONSTS.PROGRESSIVE_RENDER_MAX_DISPLACEMENT : 0);
        else this.renderAsIs();
    }

    private renderAsIs() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const gameState = this.netcode.getGameStateToRender() as PlanckGameState;
        for (let body = gameState.world?.getBodyList(); body; body = body.getNext()) {
            if (!body.getUserData()) continue;
            if (body.isStatic()) {
                this.drawStaticBody(body);
            } else {
                this.drawDynamicBody(body);
            }
        }
        this.renderScores(gameState);
    }

    private renderWithInterpolation(maxDisplacement: number) {
        let currentTime = currentTimestamp();
        const gameState = this.netcode.getGameStateToRender() as PlanckGameState;
        const gameStateTime = this.netcode.tickTime(gameState.tick);
        const nextGameState = this.netcode.getGameState(gameState.tick + 1) as (PlanckGameState | undefined);
        const nextGameStateTime = nextGameState ? this.netcode.tickTime(nextGameState.tick) : undefined;

        if (nextGameStateTime) {
            // we want to render previous game state, so rewind 1 tick in time
            currentTime -= (nextGameStateTime - gameStateTime);
        }
        // make sure we don't travel to the future
        if (currentTime > gameStateTime + this.netcode.tickMs) {
            currentTime = gameStateTime + this.netcode.tickMs;
        }
        
        const interpolationInfo = new InterpolationInfo(
            currentTime,
            gameState,
            gameStateTime,
            (currentTime - gameStateTime) / 1000,
            nextGameState,
            nextGameState ? this.netcode.tickTime(nextGameState.tick) : undefined,
            nextGameStateTime ? (currentTime - nextGameStateTime) / 1000 : 0,
            nextGameStateTime ? (nextGameStateTime - gameStateTime) / 1000 : this.netcode.tickMs / 1000,
            maxDisplacement
        );
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let body = gameState.world?.getBodyList(); body; body = body.getNext()) {
            if (!body.getUserData()) continue;
            if (body.isStatic()) {
                this.drawStaticBody(body);
            } else {
                this.drawDynamicBodyWithInterpolation(body, interpolationInfo);
            }
        }
        this.renderScores(gameState);
    }

    private drawStaticBody(body: planck.Body) {
        let width = (<any>body.getUserData()).width;
        let height = (<any>body.getUserData()).height;
        this.context.fillStyle = (<any>body.getUserData()).color;
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

    private drawDynamicBodyWithInterpolation(body: planck.Body, interpolationInfo: InterpolationInfo) {
        let player: PlayerConfig = <any>body.getUserData();
        let x = 0, y = 0;
        let nextBody;
        if (!interpolationInfo.nextGameState) {
            // prediction: calc new position from current one, velocity and time elapsed
            x = body.getPosition().x + body.getLinearVelocity().x * interpolationInfo.elapsed;
            y = body.getPosition().y + body.getLinearVelocity().y * interpolationInfo.elapsed;
        } else {
            // interpolation
            nextBody = PlanckGameStateUtils.bodyFromPlayer(interpolationInfo.nextGameState as PlanckGameState, (<PlayerConfig>body.getUserData()).id);
            if (nextBody) {
                const pos0 = body.getPosition();
                const pos1 = nextBody.getPosition();
                /*
                x = (pos0.x + (interpolationInfo.elapsed * (pos1.x - pos0.x)) / interpolationInfo.tickTimeDiff);
                y = (pos0.y + (interpolationInfo.elapsed * (pos1.y - pos0.y)) / interpolationInfo.tickTimeDiff);
                //*/
                //*
                const vel0 = body.getLinearVelocity();
                const vel1 = nextBody.getLinearVelocity();
                if (Math.sign(vel0.x) === Math.sign(vel1.x)) {
                    // if velocity has the same sign, use position-based interpolation
                    x = (pos0.x + (interpolationInfo.elapsed * (pos1.x - pos0.x)) / interpolationInfo.tickTimeDiff);
                } else {
                    // if the velocity is opposite, calc new position based on previous position and velocity
                    if (interpolationInfo.elapsed < -interpolationInfo.nextElapsed) {
                        x = (pos0.x + vel0.x * interpolationInfo.elapsed);
                    } else {
                        x = (pos1.x + vel1.x * interpolationInfo.nextElapsed);
                    }
                }
                if (Math.sign(vel0.y) === Math.sign(vel1.y)) {
                    // if velocity has the same sign, use position-based interpolation
                    y = (pos0.y + (interpolationInfo.elapsed * (pos1.y - pos0.y)) / interpolationInfo.tickTimeDiff);
                } else {
                    // if the velocity is opposite, calc new position based on previous position and velocity
                    if (interpolationInfo.elapsed < -interpolationInfo.nextElapsed) {
                        y = (pos0.y + vel0.y * interpolationInfo.elapsed);
                    } else {
                        y = (pos1.y + vel1.y * interpolationInfo.nextElapsed);
                    }
                }
                //*/
            }
        }
        let posX, posY;
        // game state position
        if (this._debugBoxes) {
            posX = body.getPosition().x * config.physics.worldScale - player.size / 2;
            posY = body.getPosition().y * config.physics.worldScale - player.size / 2;
            //this.log.logInfo(`P${player.id} G.S. x=${posX} y=${posY}`);
            this.context.beginPath();
            this.context.rect(posX, posY, player.size, player.size);
            this.context.strokeStyle = 'red';
            this.context.stroke();
            // next game state position
            if (nextBody) {
                posX = nextBody.getPosition().x * config.physics.worldScale - player.size / 2;
                posY = nextBody.getPosition().y * config.physics.worldScale - player.size / 2;
                //this.log.logInfo(`P${player.id} Next G.S. x=${posX} y=${posY}`);
                this.context.beginPath();
                this.context.rect(posX, posY, player.size, player.size);
                this.context.strokeStyle = 'blue';
                this.context.stroke();
            }
        }
        // interpolation
        posX = x * config.physics.worldScale - player.size / 2;
        posY = y * config.physics.worldScale - player.size / 2;
        // gently bring the object closer to their desired position
        if (interpolationInfo.maxDisplacement > 0) {
            let latestRenderedPosition = this.renderedPositions.get(player.id);
            if (latestRenderedPosition) {
                let displacement = posX - latestRenderedPosition.x;
                if (Math.abs(displacement) > interpolationInfo.maxDisplacement) {
                    posX = latestRenderedPosition.x + interpolationInfo.maxDisplacement * Math.sign(displacement);
                    latestRenderedPosition.x = posX;
                }
                displacement = posY - latestRenderedPosition.y;
                if (Math.abs(displacement) > interpolationInfo.maxDisplacement) {
                    posY = latestRenderedPosition.y + interpolationInfo.maxDisplacement * Math.sign(displacement);
                    latestRenderedPosition.y = posY
                }
            } else {
                this.renderedPositions.set(player.id, new Vector(posX, posY));
            }
        }
        //this.log.logInfo(`P${player.id} Interpolation x=${posX} y=${posY}`);
        //*
        this.context.fillStyle = player.color;
        this.context.fillRect(posX, posY, player.size, player.size);
        //*/
        /*
        this.context.beginPath();
        this.context.rect(posX, posY, player.size, player.size);
        this.context.strokeStyle = player.color;
        this.context.stroke();
        //*/
    }

    private renderScores(gameState: PlanckGameState) {
        this.context.font = "16px monospace";
        let x = 10;
        config.players.forEach((player, index) => {
            this.context.fillStyle = config.players[index].color;
            this.context.fillText(`P${player.id}: ${gameState.scores[index]}`, x + (140*index), 20);
        });
    }

}