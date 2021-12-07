import { encode } from 'cbor-x/encode';
import { decode } from 'cbor-x/decode';
import { Serializer } from './serializer';
import { Message } from '../../model';

export class CborSerializer implements Serializer {

    encode(message: Message): ArrayBuffer {
        return encode(message);
    }
    
    decode(buffer: ArrayBuffer): Message {
        return decode(new Uint8Array(buffer));
    }
    
}