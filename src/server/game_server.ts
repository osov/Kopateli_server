import { ExtWebSocket, UserStatus, WsClient } from "../modules/types";
import { WsServer } from "../modules/WsServer";
import { Clients } from "../utils/clients";
import { IBaseRoom } from "../rooms/base_room";
import { NetMessages } from "../config/net_messages";
import { SimpleRoom } from "../rooms/simple_room";
import { CommandServer, ICommandServer } from "./command_server";

export function GameServer(server_port: number, step_world_rate = 60, rate_socket = 60 / 30) {
    const step_world = Math.floor(1000 / step_world_rate);
    let last_tick_time = System.now();
    let cnt_ticks = 0;

    let command_server: ICommandServer;
    const rooms: { [k: string]: IBaseRoom } = {};
    const clients = Clients();

    async function start() {
        const ws_server = WsServer<ExtWebSocket>(server_port,
            // on_data
            (client, data) => {
                log('client data', client.data, data);
                try {
                    const pack = JSON.parse(data as string);
                    on_message(client, pack.id as any, pack.message as any);
                } catch (e: any) {
                    Log.error("Ошибка при парсинге: " + e.message + "\nid_user=", client.data, 'данные:', data, '\nстек:', e.stack);
                }

            },
            //on_client_connected,
            (client) => {
                log('client connected', client.data);
                on_connect(client);
            }
            //on_client_disconnected
            , (client) => {
                log('client disconnected', client.data);
                on_disconnect(client);
            }
        );
        log("Запущен сервер на порту:" + server_port);

        rooms[1] = SimpleRoom(1, clients); // todo debug room
        command_server = CommandServer(server_port + 1, clients, ws_server);
        setTimeout(() => update(), step_world);
    }



    function update() {
        const now = System.now();
        const dt = now - last_tick_time;
        last_tick_time = now;
        cnt_ticks++;
        for (const rid in rooms) {
            const room = rooms[rid];
            room.update(dt);
            if (cnt_ticks % rate_socket === 0)
                room.on_socket_update();
        }
        if (dt > 0.5)
            Log.warn('Performance is slow', dt);
        setTimeout(() => update(), step_world);
    }

    function on_connect(socket: WsClient) {
        socket.data.status = UserStatus.NONE;
    }

    async function on_disconnect(socket: WsClient) {
        if (socket.data.id_user !== undefined) {
            clients.remove(socket.data.id_user);
            if (socket.data.id_room !== undefined) {
                const rid = socket.data.id_room;
                const room = rooms[rid];
                if (room != undefined)
                    room.on_leave(socket);
            }
        }
    }


    async function on_message<T extends keyof NetMessages>(socket: WsClient, id_message: T, _message: NetMessages[T]) {
        //log('on_message', id_message, _message);
        if (id_message == 'CS_Connect') {
            const message = _message as NetMessages['CS_Connect'];
            const id_session = message.id_session;
            // todo временно отключил
            /*
            const is_ok = check_hash(id_session, message.hash);
            if (!is_ok) {
                Log.error('Хеши не сходятся!', message);
                clients.remove_by_socket(socket);
                socket.close();
                return;
            }
            */
            socket.data.id_session = id_session; // add session
            let user_data = await Users.get_by_id_session(id_session);
            if (!user_data) user_data = await Users.create(id_session);
            if (!user_data)
                return Log.error("Ошибка создания нового пользователя", id_session);
            const id_user = user_data.id;
            const connected_client = clients.get_client_by_id(id_user);
            if (connected_client)
                connected_client.close();
            socket.data.id_user = id_user;
            clients.add(id_user, socket);
            // todo test
            rooms[1].on_join(socket, {});
            socket.data.id_room = 1;
            socket.data.status = UserStatus.REGISTER;
            return;
        }
        if (socket.data.id_user === undefined)
            return Log.warn("сокет не имеет id_user");

        // ответ на пинг мгновенный для точной синхронизации
        if (id_message == 'CS_Ping') {
            const message = _message as NetMessages['CS_Ping'];
            clients.send_message_socket(socket, 'SC_Pong', { client_time: message.client_time, server_time: System.now() });
            return;
        }

        const user = Users.get_cached_by_id_user(socket.data.id_user);
        // process rooms
        const room = rooms[socket.data.id_room];
        if (room)
            room.on_message(socket, id_message, _message);
    }

    return { start };
}