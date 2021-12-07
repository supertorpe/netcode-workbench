import { Message } from '../../model';

export interface Serializer {
    encode(message: Message): ArrayBuffer;
    decode(buffer: ArrayBuffer): Message;
}