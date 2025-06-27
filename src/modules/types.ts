/* eslint-disable @typescript-eslint/no-explicit-any */

import {ServerWebSocket} from "bun";

export interface ExtWebSocket {
    id_user: number;
    prev_room:string;
    id_room:string;
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
    WAIT_AUTHORIZE,
    WAIT_LOADING,
    IN_ROOM,
}

export type UserState = {
    id: number
    id_session: string
    nick: string

    x: number
    y: number
    angle: number
    gender: number
    speed: number
}
