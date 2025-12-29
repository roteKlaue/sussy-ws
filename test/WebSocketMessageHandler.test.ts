import { WebSocketMessageHandler } from "../src/classes/WebSocketMessageHandler";
import { MessageBase } from "../src/types/WSTypes";
import { EventEmitter } from "events";

describe("WebSocketMessageHandler", () => {
    it("routes messages by type", () => {
        const server = new EventEmitter() as any;
        const handler = new WebSocketMessageHandler<MessageBase<"ping">, MessageBase<"ping">>(server);

        const listener = jest.fn();
        handler.on("ping", listener);

        const client = {} as any;
        server.emit("message", { type: "ping", timestamp: new Date() }, client);

        expect(listener).toHaveBeenCalled();
    });
});
