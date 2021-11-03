import configJson from './config.json';

export class CanvasConfig {
    constructor(public width: number, public height: number) { }
}
export class NetworkConfig {
    constructor(public tickMs: number, public minLatency: number, public maxLatency: number) { }
}
export class PlayerConfig {
    constructor(
        public id: number, public color: string,
        public x: number, public y: number, public size: number,
        public keyUp: number, public keyDown: number, public keyLeft: number, public keyRight: number,) { }
}
export class PhysicsConfig {
    constructor(public worldScale: number, public strength: number, public borderThickness: number) { }
}
export class Config {
    constructor(
        public canvas: CanvasConfig,
        public network: NetworkConfig,
        public players: PlayerConfig[],
        public physics: PhysicsConfig
    ) { }
}

export const config: Config = (<any>configJson).config;