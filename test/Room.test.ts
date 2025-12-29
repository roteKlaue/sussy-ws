import { Room } from "../src/classes/Room";
import { Client } from "../src/classes/Client";
import { createMockSocket } from "./mocks/mockWebSocket";

describe("Room", () => {
    it("adds and removes clients", () => {
        const room = new Room("test");
        const client = new Client(createMockSocket());

        expect(room.add(client)).toBe(true);
        expect(room.has(client)).toBe(true);

        expect(room.remove(client)).toBe(true);
        expect(room.has(client)).toBe(false);
    });

    it("does not add same client twice", () => {
        const room = new Room();
        const client = new Client(createMockSocket());

        room.add(client);
        expect(room.add(client)).toBe(false);
    });

    it("detects empty room", () => {
        const room = new Room();
        expect(room.isEmpty()).toBe(true);
    });
});
