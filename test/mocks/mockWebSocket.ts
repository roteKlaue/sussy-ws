import { WebSocket } from "ws";
import EventEmitter from "node:events";

export const createMockSocket = () => {
    const emitter = new EventEmitter();

    return {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
        ping: jest.fn(),
        terminate: jest.fn(),
        on: emitter.on.bind(emitter),
        once: emitter.once.bind(emitter),
        emit: emitter.emit.bind(emitter),
    } as any;
};
