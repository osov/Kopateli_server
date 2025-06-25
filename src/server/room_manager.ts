import { NetIdMessages, NetMessages, RequestType } from "../config/net_messages";
import { User, UserStatus, WsClient } from "../modules/types";
import { IBaseRoom } from "../rooms/base_room";
import { GameRoom } from "../rooms/game_room";
import { IClients } from "../utils/clients";

export function RoomManager(clients: IClients) {
    const locations = GAME_CONFIG.locations;
    const rooms: { [k: string]: IBaseRoom } = {};

    async function init() {
        for (const id in GAME_CONFIG.locations) {
            await load_location_data(id);
            add_room(id);
        }
    }

    async function load_location_data(name: string) {
        const scn_data = await load_scn_data(name);
        if (!scn_data)
            return Log.warn('Не данных по локации:', name);
        const mul_scalar = name.includes('home') ? GAME_CONFIG.HOME_SCALAR : 1;
        for (let i = 0; i < scn_data.scene_data.length; i++) {
            const sd = scn_data.scene_data[i];
            if (sd.name == 'zones') {
                for (let i = 0; i < sd.children.length; i++) {
                    const zone = sd.children[i];
                    const x = zone.position[0] * mul_scalar;
                    const y = zone.position[1] * mul_scalar;
                    const w = zone.other_data.size![0] * mul_scalar;
                    const h = zone.other_data.size![1] * mul_scalar;
                    if (locations[name].zones == undefined)
                        locations[name].zones = [];
                    locations[name].zones.push({ name: zone.name, x, y, width: w, height: h });
                }
            }
        }
    }

    async function load_scn_data(name: string) {
        try {
            const path = "./data/scene_data/" + name + ".scn";
            const file = await Bun.file(path).text();
            return JSON.parse(file);
        }
        catch (e) {
            return null;
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

    async function on_user_authorized(socket: WsClient, user: User) {
        socket.data.id_room = 'main';
        socket.data.status = UserStatus.WAIT_LOADING;
        // юзеру - инфу о соединении
        const location = locations[socket.data.id_room as keyof typeof locations];
        clients.send_message_socket(socket, NetIdMessages.SC_INIT, {
            server_time: System.now(), id_user: socket.data.id_user,
            data: { id: socket.data.id_room, layer: location.layer }
        });
    }

    function get_user_positon(socket: WsClient, with_prev = false) {
        const location = locations[socket.data.id_room as keyof typeof locations];

        let x = location.x;
        let y = location.y;
        if (location.zones && location.zones.length > 0) {
            x = location.zones[0].x;
            y = location.zones[0].y;
            if (with_prev) {
                for (let i = 0; i < location.zones.length; i++) {
                    const zone = location.zones[i];
                    if (zone.name == 'to_'+socket.data.prev_room) {
                        x = zone.x;
                        y = zone.y;
                        break;
                    }

                }
            }
        }
        return { x, y }
    }

    async function on_message<T extends keyof NetMessages>(socket: WsClient, id_message: T, _message: NetMessages[T]) {
        const room = rooms[socket.data.id_room];
        if (!room)
            return;

        // запрос перехода в другую комнату
        if (id_message == NetIdMessages.CS_REQUEST_INTERACT) {
            const message = _message as NetMessages[NetIdMessages.CS_REQUEST_INTERACT];

            if (message.type == RequestType.REQUEST && socket.data.status == UserStatus.IN_ROOM) {
                if (message.id.startsWith('to_')) {
                    const to_room = message.id.substring(3);
                    if (to_room == socket.data.id_room){
                        clients.send_message_socket(socket, NetIdMessages.SC_RESPONSE_INTERACT, { status: 0, result: { id: to_room, layer: 0 } });
                        return;
                    }
                    if (to_room in locations) {
                        // уже был в какой-то комнате
                        room.on_leave(socket);
                        socket.data.prev_room = socket.data.id_room;
                        socket.data.id_room = to_room;
                        socket.data.status = UserStatus.WAIT_LOADING;
                        const location = locations[socket.data.id_room as keyof typeof locations];
                        clients.send_message_socket(socket, NetIdMessages.SC_RESPONSE_INTERACT, { status: 1, result: { id: to_room, layer: location.layer } });
                    }
                    else
                        Log.warn('Нет комнаты', to_room);
                }
                else {
                    Log.warn('Do interact', message.id);
                }
            }
            // был в процессе загрузки
            else if (message.type == RequestType.CONFIRM && socket.data.status == UserStatus.WAIT_LOADING) {
                const { x, y } = get_user_positon(socket, true);
                room.on_join(socket, { x, y });
                socket.data.status = UserStatus.IN_ROOM;
            }
            return;
        }


        // process rooms
        if (socket.data.status == UserStatus.IN_ROOM) {
            room.on_message(socket, id_message, _message);
        }
    }




    return { init, update, on_connect, on_disconnect, on_message, on_user_authorized, leave_active_room };
}