import type {
  MessageBase,
  MessageMap,
  RoomFactory,
  RWSConfig,
  SystemOutboundMessage,
} from '../types/WSTypes';
import { WebSocketServer } from './WebSocketServer';
import { Collection, Optional } from 'sussy-util';
import { type Client } from './Client';
import { Room } from './Room';

export class RoomWebSocketServer<
  UserMessage extends MessageBase,
  OutMessage extends MessageBase,
> extends WebSocketServer<UserMessage, OutMessage> {
  private readonly rooms: Collection<string, Room> = new Collection();
  private readonly removeOnEmpty: boolean;

  private readonly roomFactory: RoomFactory;
  private readonly roomSelector?: ((client: Client) => string | null) | undefined;

  public constructor(
    port: number,
    {
      roomFactory = (id) => new Room(id),
      roomSelector,
      removeOnEmpty = false,
      ...rest
    }: RWSConfig<UserMessage> = {},
  ) {
    super(port, rest);
    this.roomFactory = roomFactory;
    this.roomSelector = roomSelector;
    this.removeOnEmpty = removeOnEmpty;

    this.on('message', (message, client) => {
      if (message.type === 'disconnect') this.removeClientFromAllRooms(client);
    });
  }

  public createRoom(id?: string): Room {
    if (id && this.rooms.has(id)) return this.rooms.get(id)!;
    const room = this.roomFactory(id);
    this.rooms.set(room.id, room);
    return room;
  }

  public getRoom = (id: string): Optional<Room> => this.rooms.getOptional(id);

  public getRooms = (): Room[] => this.rooms.toArray().map((e) => e.value);

  public addClientToRoom(client: Client, roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.add(client);
    return true;
  }

  public removeClientFromRoom(client: Client, roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const removed = room.remove(client);
    if (!removed) return false;

    if (room.isEmpty() && this.removeOnEmpty) {
      this.rooms.delete(roomId);
    }

    return true;
  }

  public removeClientFromAllRooms(client: Client): void {
    for (const room of this.rooms.keys()) {
      this.removeClientFromRoom(client, room);
    }
  }

  public broadcastToRoom<K extends keyof MessageMap<OutMessage>>(
    roomId: string,
    message: MessageMap<OutMessage>[K] | SystemOutboundMessage,
    exclude?: Client,
  ): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    for (const client of room.getClients()) {
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

  public autoAssignClient(client: Client) {
    const targetId = this.roomSelector?.(client);
    if (!targetId) return;

    const room = this.createRoom(targetId);
    room.add(client);
  }

  public getClientsInRoom(roomId: string): Client[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return room.getClients();
  }

  public getRoomOfClient(client: Client): Optional<Room> {
    for (const room of this.rooms.values()) {
      if (room.has(client)) return Optional.of(room);
    }
    return Optional.empty();
  }
}

export const RWSS = RoomWebSocketServer;
