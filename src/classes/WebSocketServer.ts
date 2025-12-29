import type {
  MessageBase,
  MessageMap,
  MessageValidator,
  SystemInboundMessage,
  SystemOutboundMessage,
  WSConfig,
} from '../types/WSTypes';
import { WebSocketServer as WSSLib, WebSocket, type Data } from 'ws';
import { Collection, Optional } from 'sussy-util';
import { EventEmitter } from 'node:events';
import { Client } from './Client';

const HEARTBEAT_DEFAULT_INTERVAL = 10_000;
const HEARTBEAT_DEFAULT_TIMEOUT = 15_000;

export class WebSocketServer<
  UserMessage extends MessageBase,
  OutMessage extends MessageBase,
> extends EventEmitter {
  protected readonly clients: Collection<string, Client> = new Collection();

  private readonly wss: WSSLib;
  private readonly heartbeatInterval;
  private readonly heartbeatTimeout;
  private readonly messageValidator?: MessageValidator<UserMessage>;

  private heartbeatTimer?: NodeJS.Timeout | undefined;

  constructor(
    port: number,
    {
      heartbeatInterval = HEARTBEAT_DEFAULT_INTERVAL,
      heartbeatTimeout = HEARTBEAT_DEFAULT_TIMEOUT,
      clientFactory = (s) => new Client(s),
      messageValidator,
    }: WSConfig<UserMessage> = {},
  ) {
    super();
    this.wss = new WSSLib({ port });
    console.log(`WebSocket Server running on ws://localhost:${port}`);

    this.heartbeatInterval = heartbeatInterval;
    this.heartbeatTimeout = heartbeatTimeout;
    this.messageValidator = messageValidator;

    this.wss.on('connection', (socket: WebSocket) => {
      const client: Client = clientFactory(socket);
      console.log('[Client] client connected: ' + client.id);
      console.log('[Client] amount of connected clients: ' + (this.clients.count() + 1));
      this.clients.set(client.id, client);

      const msg: SystemInboundMessage = { type: 'connect', timestamp: new Date() };
      this.emit('message', msg, client);

      socket.on('message', (data) => this.handleMessage(data, client));
      socket.on('close', () => this.handleDisconnect(client));
      socket.on('error', (err) => console.error(`Socket error for client ${client.id}:`, err));
      socket.on('pong', () => (client.lastPong = Date.now()));
    });

    if (heartbeatInterval > 0) this.startHeartbeat();
  }

  private startHeartbeat = () => {
    if (this.heartbeatTimer) return;

    this.heartbeatTimer = setInterval(() => {
      for (const client of this.clients.values()) {
        if (client.socket.readyState !== WebSocket.OPEN) {
          this.handleDisconnect(client);
          continue;
        }

        if (Date.now() - client.lastPong > this.heartbeatTimeout) {
          client.socket.terminate();
          this.handleDisconnect(client);
          continue;
        }

        try {
          client.socket.ping();
        } catch {
          client.socket.terminate();
          this.handleDisconnect(client);
          continue;
        }
      }
    }, this.heartbeatInterval);
  };

  private sendError(client: Client, message: string) {
    this.send(client, { type: 'error', timestamp: new Date(), message });
  }

  private handleMessage(data: Data, client: Client) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(data.toString());
    } catch {
      return this.sendError(client, 'Invalid JSON format');
    }

    if (!parsed || typeof parsed !== 'object' || !('type' in parsed)) {
      return this.sendError(client, 'Missing message type');
    }

    if (this.messageValidator && !this.messageValidator(parsed)) {
      return this.sendError(client, 'Invalid message');
    }

    const incoming = parsed as Partial<UserMessage>;
    const msg = {
      ...incoming,
      timestamp: incoming.timestamp ? new Date(incoming.timestamp) : new Date(),
    };

    this.emit('message', msg, client);
  }

  protected handleDisconnect(client: Client) {
    if (client.disconnected) return;
    client.disconnected = true;

    if (!this.clients.has(client.id)) return;
    this.clients.delete(client.id);

    const msg: SystemInboundMessage = { type: 'disconnect', timestamp: new Date() };
    this.emit('message', msg, client);
  }

  public send<K extends keyof MessageMap<OutMessage>>(
    client: Client,
    message: MessageMap<OutMessage>[K] | SystemOutboundMessage,
  ) {
    if (client.socket.readyState !== WebSocket.OPEN) return;
    try {
      client.socket.send(JSON.stringify(message));
    } catch {
      client.socket.terminate();
      this.handleDisconnect(client);
    }
  }

  public broadcast<K extends keyof MessageMap<OutMessage>>(
    message: MessageMap<OutMessage>[K] | SystemOutboundMessage,
    exclude?: Client,
  ) {
    for (const client of this.clients.values()) {
      if (exclude && exclude.id === client.id) continue;
      if (client.socket.readyState !== WebSocket.OPEN) continue;

      try {
        client.socket.send(JSON.stringify(message));
      } catch {
        client.socket.terminate();
        this.handleDisconnect(client);
      }
    }
  }

  public getClientById = (id: string): Optional<Client> => this.clients.getOptional(id);
  public getAllClients = () => [...this.clients.values()];

  public stop = () => {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = void 0;
    this.wss.close();
    for (const client of this.clients.values()) client.socket.terminate();
    this.clients.clear();
  };
}

export const WSS = WebSocketServer;
