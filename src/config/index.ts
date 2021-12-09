import configJson from './config.json';

export class CanvasConfig {
    constructor(public width: number, public height: number) { }
}
export class SerializerConfig {
    constructor(public name: string) { }
}
export class NetcodeConfig {
    constructor(public name: string, public type: string) { }
}
export class NetworkConfig {
    constructor(public tickMs: number,
        public minLatency1: number, public maxLatency1: number, public packetLoss1: number,
        public minLatency2: number, public maxLatency2: number, public packetLoss2: number) { }
}
export class PlayerConfig {
    constructor(
        public id: number, public color: string,
        public x: number, public y: number, public size: number,
        public keyUp: number, public keyDown: number, public keyLeft: number, public keyRight: number) { }
}
export class CoinConfig {
    constructor(public color: string, public x: number, public y: number, public size: number) { }
}
export class NpcConfig {
    constructor(public color: string) { }
}
export class BorderConfig {
    constructor(public color: string) { }
}
export class PhysicsConfig {
    constructor(public worldScale: number, public strength: number, public borderThickness: number) { }
}
export class Config {
    constructor(
        public canvas: CanvasConfig,
        public serializers: SerializerConfig[],
        public netcodes: NetcodeConfig[],
        public network: NetworkConfig,
        public players: PlayerConfig[],
        public coin: CoinConfig,
        public npc: NpcConfig,
        public border: BorderConfig,
        public physics: PhysicsConfig
    ) { }
}

export const config: Config = (<any>configJson).config;
export * from './consts';