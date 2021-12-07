import { Serializer } from './serializer';
import { Message } from '../../model';

export class JsonSerializer implements Serializer {

    private encoder = new TextEncoder();
    private decoder = new TextDecoder();

    encode(message: Message): ArrayBuffer {
        return this.encoder.encode(JSON.stringify(message));
    }
    
    decode(buffer: ArrayBuffer): Message {
        return JSON.parse(this.decoder.decode(buffer));
    }
    
}