import { NetIdMessages, NetMessages } from "../config/net_messages";
import { User, UserStatus, WsClient } from "../modules/types";
import { IBaseRoom } from "../rooms/base_room";
import { GameRoom } from "../rooms/game_room";
import { IClients } from "../utils/clients";

export function RoomManager(clients: IClients) {
    const locations = GAME_CONFIG.locations;
    const rooms: { [k: string]: IBaseRoom } = {};

    function init() {
        for (const id in GAME_CONFIG.locations) {
            add_room(id);
        }
    }

    function update(dt: number) {
        for (const rid in rooms) {
            const room = rooms[rid];
            room.update(dt);
            //if (cnt_ticks % rate_socket === 0)
            room.on_socket_update();
        }
    }

    function add_room(name: string) {
        rooms[name] = GameRoom(name, clients);
    }

    function on_connect(socket: WsClient) {
        socket.data.status = UserStatus.NONE;
    }

    async function on_disconnect(socket: WsClient) {
        if (socket.data.id_room !== '') {
            const rid = socket.data.id_room;
            const room = rooms[rid];
            if (room != undefined)
                room.on_leave(socket);
        }
    }

    function leave_active_room(socket: WsClient) {
        if (socket.data.id_room !== '') {
            const rid = socket.data.id_room;
            const room = rooms[rid];
            if (room != undefined)
                room.on_leave(socket);
        }
    }

    function on_user_authorized(socket: WsClient, user:User) { 
        socket.data.id_room = 'main';
        rooms['main'].on_join(socket, { x: locations.main.x, y: locations.main.y });
        socket.data.status = UserStatus.IN_ROOM;
    }

    async function on_message<T extends keyof NetMessages>(socket: WsClient, id_message: T, _message: NetMessages[T]) {
      
        // запрос перехода в другую комнату
        if (id_message == NetIdMessages.CS_REQUEST_INTERACT) {
            const message = _message as NetMessages[NetIdMessages.CS_REQUEST_INTERACT];
            const room = rooms[socket.data.id_room];
            if (!room)
                return;

            if (message.type == 0 && socket.data.status == UserStatus.IN_ROOM) {
                if (message.id.startsWith('to_')) {
                    const to_room = message.id.substring(3);
                    if (to_room in locations) {
                        const location = locations[to_room as keyof typeof locations];
                        room.on_leave(socket);
                        const x = location.x; 
                        const y = location.y;
                        socket.data.id_room = to_room;
                        socket.data.status = UserStatus.WAIT_LOADING;
                        clients.send_message_socket(socket, NetIdMessages.SC_RESPONSE_INTERACT, { status: 1, id: to_room, x, y });
                    }
                    else
                        Log.warn('Нет комнаты', to_room);
                }
            }
            // был в ожидании загрузки комнаты
            else if (message.type == 1 && socket.data.status == UserStatus.WAIT_LOADING) {
                room.on_join(socket, { x: GAME_CONFIG.locations[socket.data.id_room as keyof typeof GAME_CONFIG.locations].x, y: GAME_CONFIG.locations[socket.data.id_room as keyof typeof GAME_CONFIG.locations].y });
                socket.data.status = UserStatus.IN_ROOM;
            }
            return;
        }


        // process rooms
        const room = rooms[socket.data.id_room];
        if (room && socket.data.status == UserStatus.IN_ROOM) {
            room.on_message(socket, id_message, _message);
        }
    }




    return { init, update, on_connect, on_disconnect, on_message, on_user_authorized, leave_active_room };
}