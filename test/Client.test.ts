import { Client } from "../src/classes/Client";
import { createMockSocket } from "./mocks/mockWebSocket";

describe("Client", () => {
    it("initializes with id and socket", () => {
        const socket = createMockSocket();
        const client = new Client(socket);

        expect(client.id).toBeDefined();
        expect(client.socket).toBe(socket);
        expect(client.lastPong).toBeLessThanOrEqual(Date.now());
        expect(client.disconnected).toBe(false);
    });
});
