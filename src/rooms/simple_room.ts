import { NetMessages } from "../config/net_messages";
import { WsClient } from "../modules/types";
import { IClients } from "../utils/clients";
import { BaseRoom } from "./base_room";

export type ISimpleRoom = ReturnType<typeof SimpleRoom>;

export function SimpleRoom(id_room: number, clients: IClients) {
    const base = BaseRoom(clients);

    // -----------------------------------------------------------------------
    // network
    // -----------------------------------------------------------------------

    // добавляет сообщение в буфер
    function add_message<T extends keyof NetMessages>(id_message: T, message: NetMessages[T]) {
        return base.add_message(id_message, message);
    }

    function make_message<T extends keyof NetMessages>(id_message: T, message: NetMessages[T]) {
        return base.make_message(id_message, message);
    }

    // отправить конкретному сокету
    function send_message_socket<T extends keyof NetMessages>(socket: WsClient, id_message: T, message: NetMessages[T]) {
        return base.send_message_socket(socket, id_message, message);
    }

    // отправить всем
    function send_message_all<T extends keyof NetMessages>(id_message: T, message: NetMessages[T], except_socket?: WsClient) {
        return base.send_message_all(id_message, message, except_socket);
    }

    // отправить всем собранный буффер
    function send_full_buffer() {
        return base.send_full_buffer();
    }

    function insert_first_pack<T extends keyof NetMessages>(id_message: T, message: NetMessages[T]) {
        return base.insert_first_pack(id_message, message);
    }

    // -----------------------------------------------------------------------
    // Room events
    // -----------------------------------------------------------------------

    // подключился, авторизован
    function on_join(socket: WsClient, info: any) {
        const result = base.on_join(socket, info);
        log('подключился', socket.data.id_user);
        return result;
    }

    // переподключился
    function on_reconnect(socket: WsClient) {
        return base.on_reconnect(socket);
    }

    // отключился
    function on_leave(socket: WsClient) {
        return base.on_leave(socket);
    }

    function on_socket_update() {
        base.on_socket_update();
    }

    function on_message<T extends keyof NetMessages>(socket: WsClient, id_message: T, _message: NetMessages[T]) {

    }

    let last_update = System.now();
    let id_pack = 0;
    function update(dt: number) {
        if (System.now() - last_update > 5) {
            last_update = System.now();
            log("Tick");
            const users = Object.keys(base.connected_users).length;
            if (users > 0) {
                id_pack++;
                log('add test data', id_pack);
                for (let i = 0; i < 3; i++)
                    add_message('SC_Test', { users, id_pack, data: Math.random() });
            }
        }
    }


    return { on_join, on_leave, on_reconnect, on_message, add_message, insert_first_pack, make_message, send_message_socket, send_message_all, send_full_buffer, update, on_socket_update, connected_users: base.connected_users };

}