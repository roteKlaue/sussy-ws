import { randomUUID } from 'node:crypto';
import { Collection } from 'sussy-util';
import { type Client } from './Client';

export class Room {
  public readonly id: string;
  private users: Collection<string, Client> = new Collection();

  public constructor(id?: string) {
    this.id = id ?? randomUUID();
  }

  public add(client: Client): boolean {
    if (this.users.has(client.id)) return false;
    this.users.set(client.id, client);
    return true;
  }

  public remove(client: Client): boolean {
    if (!this.users.has(client.id)) return false;
    this.users.delete(client.id);
    return true;
  }

  public has = (client: Client) => this.users.has(client.id);
  public isEmpty = () => this.users.size === 0;
  public getClients = () => [...this.users.values()];
}
