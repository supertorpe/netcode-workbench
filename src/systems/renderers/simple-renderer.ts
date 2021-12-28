import { config, CONSTS } from "../../config";
import { SimpleBodyState, SimpleGameState, SimpleGameStateUtils } from "../../model";
import { BaseNetCode } from "../../netcode";
import { currentTimestamp, Vector } from "../../commons";
import { Log } from "../log";
import { Renderer } from "./renderer";

class SimpleInterpolationInfo {
    constructor(
        public currentTime: number,
        public currentGameState: SimpleGameState,
        public currentGameStateTime: number,
        public elapsed: number,
        public nextGameState: SimpleGameState | undefined,
        public nextGameStateTime: number | undefined,
        public nextElapsed: number,
        public tickTimeDiff: number,
        public maxDisplacement: number
    ) { }
}

export class SimpleRenderer extends Renderer {

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
        const gameState = this.netcode.getGameStateToRender() as SimpleGameState;
        gameState.bodies.forEach((body) => {
            if (body.isStatic) {
                this.drawStaticBody(body);
            } else {
                this.drawDynamicBody(body);
            }
        });
        this.renderScores(gameState);
    }

    private renderWithInterpolation(maxDisplacement: number) {
        let currentTime = currentTimestamp();
        const gameState = this.netcode.getGameStateToRender() as SimpleGameState;
        if (!gameState) return;
        const gameStateTime = this.netcode.tickTime(gameState.tick);
        const nextGameState = this.netcode.getGameState(gameState.tick + 1) as (SimpleGameState | undefined);
        const nextGameStateTime = nextGameState ? this.netcode.tickTime(nextGameState.tick) : undefined;

        if (nextGameStateTime) {
            // we want to render previous game state, so rewind 1 tick in time
            currentTime -= (nextGameStateTime - gameStateTime);
        }
        // make sure we don't travel to the future
        if (currentTime > gameStateTime + this.netcode.tickMs) {
            currentTime = gameStateTime + this.netcode.tickMs;
        }
        
        const interpolationInfo = new SimpleInterpolationInfo(
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
        gameState.bodies.forEach((body) => {
            if (body.isStatic) {
                this.drawStaticBody(body);
            } else {
                this.drawDynamicBodyWithInterpolation(body, interpolationInfo);
            }
        });
        this.renderScores(gameState);
    }

    private drawStaticBody(body: SimpleBodyState) {
        this.context.fillStyle = body.color;
        this.context.fillRect(
            body.posX * config.physics.worldScale - body.width / 2,
            body.posY * config.physics.worldScale - body.height / 2,
            body.width, body.height);
    }

    private drawDynamicBody(body: SimpleBodyState) {
        this.context.fillStyle = body.color;
        this.context.fillRect(
            body.posX * config.physics.worldScale - body.width / 2,
            body.posY * config.physics.worldScale - body.height / 2,
            body.width, body.height);
    }

    private drawDynamicBodyWithInterpolation(body: SimpleBodyState, interpolationInfo: SimpleInterpolationInfo) {
        let x = 0, y = 0;
        let nextBody;
        if (!interpolationInfo.nextGameState) {
            // prediction: calc new position from current one, velocity and time elapsed
            x = body.posX + body.velX * interpolationInfo.elapsed;
            y = body.posY + body.velY * interpolationInfo.elapsed;
        } else {
            // interpolation
            nextBody = SimpleGameStateUtils.bodyFromPlayer(interpolationInfo.nextGameState as SimpleGameState, body.id);
            if (nextBody) {
                /*
                x = (pos0.x + (interpolationInfo.elapsed * (pos1.x - pos0.x)) / interpolationInfo.tickTimeDiff);
                y = (pos0.y + (interpolationInfo.elapsed * (pos1.y - pos0.y)) / interpolationInfo.tickTimeDiff);
                //*/
                //*
                if (Math.sign(body.velX) === Math.sign(nextBody.velX)) {
                    // if velocity has the same sign, use position-based interpolation
                    x = (body.posX + (interpolationInfo.elapsed * (nextBody.posX - body.posX)) / interpolationInfo.tickTimeDiff);
                } else {
                    // if the velocity is opposite, calc new position based on previous position and velocity
                    if (interpolationInfo.elapsed < -interpolationInfo.nextElapsed) {
                        x = (body.posX + body.velX * interpolationInfo.elapsed);
                    } else {
                        x = (nextBody.posX + nextBody.velX * interpolationInfo.nextElapsed);
                    }
                }
                if (Math.sign(body.velY) === Math.sign(nextBody.velY)) {
                    // if velocity has the same sign, use position-based interpolation
                    y = (body.posY + (interpolationInfo.elapsed * (nextBody.posY - body.posY)) / interpolationInfo.tickTimeDiff);
                } else {
                    // if the velocity is opposite, calc new position based on previous position and velocity
                    if (interpolationInfo.elapsed < -interpolationInfo.nextElapsed) {
                        y = (body.posY + body.velY * interpolationInfo.elapsed);
                    } else {
                        y = (nextBody.posY + nextBody.velY * interpolationInfo.nextElapsed);
                    }
                }
                //*/
            }
        }
        let posX, posY;
        // game state position
        if (this._debugBoxes) {
            posX = body.posX * config.physics.worldScale - body.width / 2;
            posY = body.posY * config.physics.worldScale - body.height / 2;
            //this.log.logInfo(`P${player.id} G.S. x=${posX} y=${posY}`);
            this.context.beginPath();
            this.context.rect(posX, posY, body.width, body.height);
            this.context.strokeStyle = 'red';
            this.context.stroke();
            // next game state position
            if (nextBody) {
                posX = nextBody.posX * config.physics.worldScale - nextBody.width / 2;
                posY = nextBody.posY * config.physics.worldScale - nextBody.height / 2;
                //this.log.logInfo(`P${player.id} Next G.S. x=${posX} y=${posY}`);
                this.context.beginPath();
                this.context.rect(posX, posY, nextBody.width, nextBody.height);
                this.context.strokeStyle = 'blue';
                this.context.stroke();
            }
        }
        // interpolation
        posX = x * config.physics.worldScale - body.width / 2;
        posY = y * config.physics.worldScale - body.height / 2;
        // gently bring the object closer to their desired position
        if (interpolationInfo.maxDisplacement > 0) {
            let latestRenderedPosition = this.renderedPositions.get(body.id);
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
                this.renderedPositions.set(body.id, new Vector(posX, posY));
            }
        }        //this.log.logInfo(`P${player.id} Interpolation x=${posX} y=${posY}`);
        //*
        this.context.fillStyle = body.color;
        this.context.fillRect(posX, posY, body.width, body.height);
        //*/
        /*
        this.context.beginPath();
        this.context.rect(posX, posY, player.size, player.size);
        this.context.strokeStyle = player.color;
        this.context.stroke();
        //*/
    }

    private renderScores(gameState: SimpleGameState) {
        this.context.font = "16px monospace";
        let x = 10;
        config.players.forEach((player, index) => {
            this.context.fillStyle = config.players[index].color;
            this.context.fillText(`P${player.id}: ${gameState.scores[index]}`, x + (140*index), 20);
        });
    }
}