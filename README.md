# sussy-ws

A fully type-safe WebSocket framework for Node.js using TypeScript.  
Supports:

- Plain WebSocket servers (`WebSocketServer`)  
- Room-based WebSocket servers (`RoomWebSocketServer`)  
- Strongly typed messages (`MessageBase`, `IncomingMessage`, `MessageMap`)  
- Automatic heartbeat/ping handling  
- Message validation  
- Broadcasting and room-specific messaging  
- Event-driven message handling (`WebSocketMessageHandler`)  

---

## Installation

```bash
npm install sussy-ws
```

---

## Usage

### Basic WebSocket Server

```ts
import { WSS, Client, MessageBase } from "sussy-ws";

interface MyMessage extends MessageBase {
    type: "ping" | "chat";
    content?: string;
}

const server = new WSS<MyMessage, MyMessage>(8080);

server.on("message", (msg, client: Client) => {
    console.log("Received:", msg.type, "from", client.id);
    
    if (msg.type === "ping") {
        server.send(client, { type: "ping", timestamp: new Date() });
    }
});
```

### Room-based WebSocket Server

```ts
import { RWSS, Client, WebSocketMessageHandler, MessageBase } from "sussy-ws";

interface UserMsg extends MessageBase {
    type: "join" | "chat" | "leave";
    content?: string;
}

interface OutMsg extends MessageBase {
    type: "chat" | "error";
    content?: string;
}

const roomServer = new RWSS<UserMsg, OutMsg>(8080, {
    removeOnEmpty: true
});

const handler = new WebSocketMessageHandler<UserMsg, OutMsg>(roomServer);

handler.on("chat", (msg, client: Client) => {
    console.log(client.id, "sent:", msg.content);
    roomServer.broadcastToRoom("lobby", { type: "chat", timestamp: new Date(), content: msg.content }, client);
});
```

### Auto-assign clients to rooms

```ts
const roomServer = new RWSS<UserMsg, OutMsg>(8080, {
    roomSelector: client => "default-room"
});

roomServer.on("message", (msg, client) => {
    roomServer.autoAssignClient(client);
});
```

---

## Features

- Type-safe messages with `IncomingMessage<T>` and `MessageMap<T>`
- Rooms & auto-assignment with `RoomWebSocketServer`
- Heartbeat / ping-pong to detect dead connections
- Broadcast to all clients or a specific room
- Custom client factories for extending `Client`
- Custom message validation

---

## Classes

| Class                           | Description                                      |
| ------------------------------- | ------------------------------------------------ |
| `Client`                        | Represents a connected WebSocket client.         |
| `Room`                          | Manages clients in a room.                       |
| `WebSocketServer<T, U>`         | Type-safe WebSocket server.                      |
| `RoomWebSocketServer<T, U>`     | WebSocket server with room support.              |
| `WebSocketMessageHandler<T, U>` | Event-driven message handler for typed messages. |

---

## Types

- `MessageBase<T>` – Base type for messages.
- `IncomingMessage<T>` – Received messages with partial fields allowed.
- `MessageMap<T>` – Maps type to full message object.
- `SystemInboundMessage` – Built-in system messages (`connect`, `disconnect`, `error`).
- `SystemOutboundMessage` – Built-in outbound error messages.

