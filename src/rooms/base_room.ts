import { NetIdMessages, NetMessages } from "../config/net_messages";
import { ProtocolWrapper, WsClient } from "../modules/types";
import { IClients } from "../utils/clients";
import { deep_clone } from "../utils/utils";

export function BaseRoom(clients: IClients) {
    const connected_users: { [k: number]: WsClient } = {};
    const buffer_messages: ProtocolWrapper[] = [];

    // -----------------------------------------------------------------------
    // network
    // -----------------------------------------------------------------------

    // добавляет сообщение в буфер
    function add_message<T extends keyof NetMessages>(id_message: T, message: NetMessages[T]) {
        buffer_messages.push({ id: id_message, message: deep_clone(message) });
    }

    function make_message<T extends keyof NetMessages>(id_message: T, message: NetMessages[T]) {
        return clients.make_message(id_message, message);
    }

    // отправить конкретному сокету
    function send_message_socket<T extends keyof NetMessages>(socket: WsClient, id_message: T, message: NetMessages[T]) {
        clients.send_message_socket(socket, id_message, message);
    }

    // отправить всем
    function send_message_all<T extends keyof NetMessages>(id_message: T, message: NetMessages[T], except_socket?: WsClient) {
        const pack = make_message(id_message, message);
        for (const id_user in connected_users) {
            const socket = connected_users[id_user];
            if (socket && socket != except_socket) {
                clients.send_data_socket(socket, pack);
            }
        }
    }

    // отправить всем собранный буффер
    function send_full_buffer() {
        const buf = buffer_messages.slice(0);
        buffer_messages.splice(0, buffer_messages.length);
        for (let i = 0; i < buf.length; i++) {
            send_message_all(buf[i].id as keyof NetMessages, buf[i].message);
        }
    }

    function insert_first_pack<T extends keyof NetMessages>(id_message: T, message: NetMessages[T]) {
        buffer_messages.unshift({ id: id_message, message: deep_clone(message) });
    }

    // -----------------------------------------------------------------------
    // Room events
    // -----------------------------------------------------------------------

    // подключился, авторизован
    function on_join(socket: WsClient, info: any) {
        const id_user = socket.data.id_user;
        connected_users[id_user] = socket;
        // юзеру - инфу о соединении
        send_message_socket(socket, NetIdMessages.SC_INIT, { server_time: System.now(), id_user, data: info });
        return true;
    }

    // отключился
    function on_leave(socket: WsClient) {
        delete connected_users[socket.data.id_user];
        log("отключился id_user:", socket.data.id_user);
        add_message(NetIdMessages.SC_LEAVE, { id_user: socket.data.id_user });
    }

    function on_message<T extends keyof NetMessages>(socket: WsClient, id_message: T, _message: NetMessages[T]) {
    }

    function update(dt: number) {
        
    }

    function on_socket_update() {
        send_full_buffer();
    }



    return { on_join, on_leave, on_message, add_message, insert_first_pack, make_message, send_message_socket, send_message_all, send_full_buffer, update, on_socket_update, connected_users };
}

type IRoom = ReturnType<typeof BaseRoom>;


export interface IBaseRoom {
    on_join: IRoom['on_join'];
    on_leave: IRoom['on_leave'];
    on_message: IRoom['on_message'];
    update: IRoom['update'];
    on_socket_update: IRoom['on_socket_update'];
    connected_users: IRoom['connected_users'];
}
