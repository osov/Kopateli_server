import { NetMessages } from "../config/net_messages";
import {  WsClient } from "../modules/types";

type FilterCallback = (client: WsClient) => void;

export type IClients = ReturnType<typeof Clients>;

export function Clients() {
    const connected_sockets: { [k: number]: WsClient } = {};

    function add(id: number, socket: WsClient) {
        connected_sockets[id] = socket;
    }

    function remove(id: number) {
        delete connected_sockets[id]
    }

    function remove_by_socket(socket: WsClient) {
        for (const client_id in connected_sockets) {
            const client = connected_sockets[client_id];
            if (client == socket) {
                delete connected_sockets[client_id];
                return;
            }
        }
    }

    function make_message<T extends keyof NetMessages>(id_message: T, message: NetMessages[T]) {
        return JSON.stringify({id: id_message, message});
    }

    function send_message_socket<T extends keyof NetMessages>(socket: WsClient, id_message: T, message: NetMessages[T]) {
        if (socket.readyState === WebSocket.OPEN)
            socket.send(make_message(id_message, message));
    }


    function send_message_all<T extends keyof NetMessages>(id_message: T, message: NetMessages[T], except_socket?: WsClient) {
        const pack = make_message(id_message, message);
        for (const client_id in connected_sockets) {
            const client = connected_sockets[client_id];
            if (client != except_socket && client.readyState === WebSocket.OPEN) {
                client.send(pack);
            }
        }
    }

    function send_data_socket(socket: WsClient, pack: any) {
        if (socket.readyState === WebSocket.OPEN)
            socket.send(pack);
    }

    function for_each(filter: FilterCallback) {
        for (const client_id in connected_sockets) {
            const client = connected_sockets[client_id];
            if (client.readyState === WebSocket.OPEN) {
                filter(client);
            }
        }
    }

    function get_client_by_id(id: number) {
        return connected_sockets[id];
    }


    return {
        add,
        remove,
        remove_by_socket,
        make_message,
        send_message_socket,
        send_message_all,
        send_data_socket,
        for_each,
        get_client_by_id,
        connected_sockets
    }
}