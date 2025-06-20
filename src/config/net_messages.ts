export interface NetMessage {
    id: NetIdMessages,
    msg: any
}

export interface PostData {
    id_session: string
    cmd: number
}

export enum NetIdMessages {
    CS_CONNECT,
    CS_PING,
    SC_PONG,
    SC_INIT,
    SC_CLOSE,
    SC_LEAVE,
    CS_INPUT_STICK,
    SC_WORLD_STATE,
    SC_JOIN,
    SC_STATE_CHANGE
}

interface CS_PING {
    client_time: number
}

interface SC_PONG {
    client_time: number
    server_time: number
}

interface CS_CONNECT {
    id_session: string
    hash: string
    version: number
}

interface SC_INIT {
    id_user: number
    server_time: number
    data?: any
}

interface SC_CLOSE {
    reason?: string;
}

interface SC_LEAVE {
    id_user: number
}

interface CS_INPUT_STICK {
    angle: number;
    state: number;
}


export enum EntityStatus {
    IDLE,
    MOVING,
    DIGGING,
    FINDING,
    DIE
}

export interface EntityState {
    id: number;
    position: { x: number, y: number };
    angle: number;
    status: EntityStatus;
    status_data?: any;
}

export type EntityFullState = EntityState & {
    nick: string;
    male:number;
    speed:number
};

interface SC_WORLD_STATE {
    time: number
    list: EntityFullState[]
}

interface SC_JOIN {
    id_user: number
}

type SC_STATE_CHANGE = EntityState & {
    time: number
};

export type NetMessages = {
    [NetIdMessages.CS_PING]: CS_PING
    [NetIdMessages.SC_PONG]: SC_PONG
    [NetIdMessages.CS_CONNECT]: CS_CONNECT
    [NetIdMessages.SC_INIT]: SC_INIT
    [NetIdMessages.SC_CLOSE]: SC_CLOSE
    [NetIdMessages.SC_LEAVE]: SC_LEAVE
    [NetIdMessages.CS_INPUT_STICK]: CS_INPUT_STICK
    [NetIdMessages.SC_WORLD_STATE]: SC_WORLD_STATE
    [NetIdMessages.SC_JOIN]: SC_JOIN
    [NetIdMessages.SC_STATE_CHANGE]: SC_STATE_CHANGE
};