import type {
  MessageBase,
  MessageMap,
  IncomingMessage,
  SystemInboundMessage,
} from '../types/WSTypes';
import { type WebSocketServer } from './WebSocketServer';
import EventEmitter from 'node:events';
import { type Client } from './Client';

export class WebSocketMessageHandler<
  T extends MessageBase,
  OutMessage extends MessageBase,
  FullMessage extends T | SystemInboundMessage = T | SystemInboundMessage,
> extends EventEmitter {
  constructor(server: WebSocketServer<T, OutMessage>) {
    super();

    server.on('message', (message: IncomingMessage<FullMessage>, client: Client) => {
      this.emit(message.type, message, client);
    });
  }

  public override on<K extends keyof MessageMap<FullMessage>>(
    eventName: K,
    listener: (msg: IncomingMessage<MessageMap<FullMessage>[K]>, client: Client) => void,
  ): this {
    return super.on(eventName, listener);
  }
}

export const WSMH = WebSocketMessageHandler;
