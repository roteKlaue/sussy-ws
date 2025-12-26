import { type Client } from "../classes/Client";
import { type Room } from "../classes/Room";
import { type WebSocket } from "ws";

export type MessageBase<T extends string = string> = {
    type: T;
    timestamp: Date;
};

type KnownLiteralTypes<T extends { type: string }> =
    T extends { type: infer U }
        ? (string extends U ? never : U)
        : never;

export type MessageMap<T extends MessageBase> = {
    [K in KnownLiteralTypes<T>]: Extract<T, { type: K }>;
};

export type IncomingMessage<T extends MessageBase> =
    Partial<T> & {
        type: KnownLiteralTypes<T>;
        timestamp: Date;
    };

export type SystemInboundMessage =
    | MessageBase<"connect">
    | MessageBase<"disconnect">
    | (MessageBase<"error"> & { message: string });

export type SystemOutboundMessage =
    | (MessageBase<"error"> & { message: string });

export type RoomFactory = (id?: string) => Room;
export type MessageValidator<T extends MessageBase> = (msg: unknown) => msg is IncomingMessage<T>;

export type WSConfig<T extends MessageBase> = {
    heartbeatInterval?: number;
    heartbeatTimeout?: number;
    clientFactory?: (socket: WebSocket) => Client;
    messageValidator?: MessageValidator<T>;
};

export type RWSConfig<T extends MessageBase> = WSConfig<T> & {
    roomFactory?: RoomFactory;
    roomSelector?: (client: Client) => string | null;
    removeOnEmpty?: boolean;
};
