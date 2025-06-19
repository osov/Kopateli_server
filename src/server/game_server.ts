import { ExtWebSocket, UserStatus, WsClient } from "../modules/types";
import { WsServer } from "../modules/WsServer";
import { Clients } from "../utils/clients";
import { IBaseRoom } from "../rooms/base_room";
import { NetIdMessages, NetMessages } from "../config/net_messages";
import { GameRoom } from "../rooms/game_room";
import { CommandServer, ICommandServer } from "./command_server";
import { check_hash } from "./common";

export function GameServer(server_port: number, step_world_rate = 60, rate_socket = 60 / 30) {
    const step_world = Math.floor(1000 / step_world_rate);
    let last_tick_time = System.now();
    let cnt_ticks = 0;
    let server: ReturnType<typeof WsServer<ExtWebSocket>>;
    let command_server: ICommandServer;
    const rooms: { [k: string]: IBaseRoom } = {};
    const clients = Clients();

    async function start() {
        server = WsServer<ExtWebSocket>(server_port,
            // on_data
            (client, data) => {
                log('client data', client.data, data.toString());
                try {
                    const pack = JSON.parse(data as string);
                    on_message(client, pack.id as any, pack.msg as any);
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

        rooms[1] = GameRoom(1, clients); // todo debug room
        command_server = CommandServer(server_port + 1, clients, server);
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
            //if (cnt_ticks % rate_socket === 0)
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

        // пакет авторизации
        if (id_message == NetIdMessages.CS_CONNECT) {
            const message = _message as NetMessages[NetIdMessages.CS_CONNECT];
            const id_session = message.id_session;
            const is_ok = check_hash(id_session, message.hash);
            // todo временно
            if (!is_ok) {
                //Log.error('Хеши не сходятся!', message);
                //server.remove_client_by_socket(socket);
                //return;
            }
            socket.data.id_session = id_session; // add session
            let user_data = await Users.get_by_id_session(id_session);
            if (user_data === undefined) {
                user_data = await Users.create(id_session);
                if (user_data === undefined) {
                    Log.error("Ошибка создания нового пользователя", id_session);
                    return;
                }
                log('Регистрация нового пользователя:', user_data);
            }
            const id_user = user_data.id;
            //Database.update_last_online(id_user);
            const connected_client = clients.get_client_by_id(id_user);
            if (connected_client) {
                Log.error('[!!!] Пользователь уже подключен, отключаем другого:', message);
                Log.error('client:', connected_client.data);
                // был в комнате, корректно обработаем
                if (connected_client.data.id_room != -1) {
                    const room = rooms[connected_client.data.id_room];
                    if (room)
                        room.on_leave(connected_client);
                }
                clients.remove_by_socket(connected_client);
                server.remove_client_by_socket(connected_client);
            }
            socket.data.id_user = id_user;
            clients.add(id_user, socket);

            // todo test
            socket.data.id_room = 1;
            rooms[1].on_join(socket, {});
            socket.data.status = UserStatus.REGISTER;
            return;
        }
        if (socket.data.id_user === undefined)
            return Log.warn("сокет не имеет id_user");

        // ответ на пинг мгновенный для точной синхронизации
        if (id_message == NetIdMessages.CS_PING) {
            const message = _message as NetMessages[NetIdMessages.CS_PING];
            clients.send_message_socket(socket, NetIdMessages.SC_PONG, { client_time: message.client_time, server_time: System.now() });
            return;
        }

        const user = Users.get_cached_by_id_user(socket.data.id_user);
        if (!user) {
            Log.error('[!!!] Юзер не найден среди подключенных', id_message, _message);
            return;
        }
        // process rooms
        const room = rooms[socket.data.id_room];
        if (room)
            room.on_message(socket, id_message, _message);
    }

    return { start };
}