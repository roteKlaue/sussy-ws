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

import { WebSocketServer } from "../src/classes/WebSocketServer";
import { createMockSocket } from "./mocks/mockWebSocket";

describe("WebSocketServer", () => {
    it("emits connect message on new connection", () => {
        const server = new WebSocketServer(0, { heartbeatInterval: 0 });

        const onMessage = jest.fn();
        server.on("message", onMessage);

        const socket = createMockSocket();

        (server as any).wss.emit("connection", socket);

        expect(onMessage).toHaveBeenCalledWith(
            expect.objectContaining({ type: "connect" }),
            expect.anything()
        );
    });

    it("sends error on invalid JSON", () => {
        const server = new WebSocketServer(0, { heartbeatInterval: 0 });
        const socket = createMockSocket();

        (server as any).wss.emit("connection", socket);

        socket.emit("message", Buffer.from("{"));

        expect(socket.send).toHaveBeenCalledWith(
            expect.stringContaining("Invalid JSON")
        );
    });

    it("broadcasts messages", () => {
        const server = new WebSocketServer(0, { heartbeatInterval: 0 });

        const s1 = createMockSocket();
        const s2 = createMockSocket();

        (server as any).wss.emit("connection", s1);
        (server as any).wss.emit("connection", s2);

        server.broadcast({ type: "error", timestamp: new Date(), message: "x" });

        expect(s1.send).toHaveBeenCalled();
        expect(s2.send).toHaveBeenCalled();
    });
});
