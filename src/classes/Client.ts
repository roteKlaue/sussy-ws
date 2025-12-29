import { randomUUID } from 'node:crypto';
import { type WebSocket } from 'ws';

export class Client {
  public readonly id: string;
  public readonly socket: WebSocket;

  public lastPong: number;
  public disconnected = false;

  public constructor(socket: WebSocket) {
    this.id = randomUUID();
    this.socket = socket;
    this.lastPong = Date.now();
  }
}
