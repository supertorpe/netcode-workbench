import { Log } from "../log";
import { JsonSerializer } from "./json-serializer";
import { CborSerializer } from "./cbor-serializer";
import { MsgPackSerializer } from "./msgpack-serializer";
import { Serializer } from "./serializer";

export class SerializerFactory {
    constructor() { }
    public static build(name: string, log: Log): Serializer {
        switch (name) {
            case 'json':
                log.logInfo('Using json serializer');
                return new JsonSerializer();
            case 'cbor-x':
                log.logInfo('Using cbor-x serializer');
                return new CborSerializer();
            case 'msgpackr':
                log.logInfo('Using msgpackr serializer');
                return new MsgPackSerializer();
            default:
                log.logInfo(`Serializer ${name} not found. Fallback to json serializer`);
                return new JsonSerializer();
        }
    }
}