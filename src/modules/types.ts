/* eslint-disable @typescript-eslint/no-explicit-any */

import {ServerWebSocket} from "bun";

export interface ExtWebSocket {
    id_user: number;
    id_room:number;
    id_session: string;
    status: UserStatus;
}

export type WsClient = ServerWebSocket<ExtWebSocket>;


export interface ProtocolWrapper {
    id: number;
    message: any;
}

export enum UserStatus {
    NONE,
    REGISTER,
}

export type User = {
    id: number
    id_session: string
    nick: string
}
