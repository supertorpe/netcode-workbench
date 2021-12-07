import { unpack, pack } from 'msgpackr';
import { Serializer } from './serializer';
import { Message } from '../../model';

export class MsgPackSerializer implements Serializer {

    encode(message: Message): ArrayBuffer {
        return pack(message);
    }
    
    decode(buffer: ArrayBuffer): Message {
        return unpack(new Uint8Array(buffer));
    }
    
}