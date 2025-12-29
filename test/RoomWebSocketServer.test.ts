jest.mock("ws", () => {
    const EventEmitter = require("events");

    return {
        WebSocket: {
            OPEN: 1,
        },
        WebSocketServer: class extends EventEmitter {
            constructor() { super(); }
            close = jest.fn();
        }
    };
});

import { RoomWebSocketServer } from "../src/classes/RoomWebSocketServer";
import { createMockSocket } from "./mocks/mockWebSocket";
import { Client } from "../src/classes/Client";

describe("RoomWebSocketServer", () => {
    it("adds client to room and broadcasts", () => {
        const server = new RoomWebSocketServer(0, { heartbeatInterval: 0 });
        const socket = createMockSocket();
        const client = new Client(socket);
        const client2 = new Client(createMockSocket());

        const room = server.createRoom("abc");
        server.addClientToRoom(client, room.id);

        server.broadcastToRoom(room.id, {
            type: "error",
            timestamp: new Date(),
            message: "hi"
        });

        expect(client.socket.send).toHaveBeenCalled();
        expect(client2.socket.send).not.toHaveBeenCalled();
    });

    it("removes empty rooms when configured", () => {
        const server = new RoomWebSocketServer(0, {
            removeOnEmpty: true,
            heartbeatInterval: 0
        });

        const client = new Client(createMockSocket());
        const room = server.createRoom("x");

        server.addClientToRoom(client, room.id);
        server.removeClientFromRoom(client, room.id);

        expect(server.getRoom("x").isPresent()).toBe(false);
    });
});
