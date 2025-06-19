import { EntityFullState, EntityState, NetIdMessages, NetMessages } from "../config/net_messages";
import { IUser, User } from "../entitys/user";
import { WsClient } from "../modules/types";
import { IClients } from "../utils/clients";
import { BaseRoom } from "./base_room";

export type IGameRoom = ReturnType<typeof GameRoom>;

export function GameRoom(id_room: number, clients: IClients) {
    const base = BaseRoom(clients);
    const users: { [id_user: number]: IUser } = {};

    function get_world_state() {
        const list: EntityFullState[] = [];
        for (const id_user in users) {
            list.push(users[id_user].get_state());
        }
        return list;
    }

    // подключился, авторизован
    function on_join(socket: WsClient, info: any) {
        const result = base.on_join(socket, info);
        const id_user = socket.data.id_user;
        const user = User(socket.data.id_user, 'nick-' + id_user, 10);
        user.load_state(313, -245, 0);
        users[id_user] = user;
        // отправляем полный стейт мира
        base.send_message_socket(socket, NetIdMessages.SC_WORLD_STATE, { time: System.now(), list: get_world_state() });
        base.add_message(NetIdMessages.SC_JOIN, { id_user });
        log('подключился', id_user);
        return result;
    }

    // отключился
    function on_leave(socket: WsClient) {
        delete users[socket.data.id_user];
        return base.on_leave(socket);
    }


    function on_message<T extends keyof NetMessages>(socket: WsClient, id_message: T, _message: NetMessages[T]) {
        if (id_message == NetIdMessages.CS_INPUT_STICK) {
            const message = _message as NetMessages[NetIdMessages.CS_INPUT_STICK];
            const user = users[socket.data.id_user];
            user.on_input_stick(message);
            // пересчитанный стейт добавляем в общую очередь на обработку
            const state = user.get_state();
            base.add_message(NetIdMessages.SC_STATE_CHANGE,
                { time: System.now(), id: state.id, position: state.position, angle: state.angle, status: state.status, status_data: state.status_data });
        }
    }

    function update(dt: number) {
        for (const id_user in users) {
            const user = users[id_user];
            user.update(dt);
        }
    }



    return {
        on_join, on_leave, on_message, update,
        add_message: base.add_message, on_socket_update: base.on_socket_update, insert_first_pack: base.insert_first_pack, make_message: base.make_message, send_message_socket: base.send_message_socket, send_message_all: base.send_message_all, send_full_buffer: base.send_full_buffer, connected_users: base.connected_users
    };

}