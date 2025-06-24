import { EntityFullState, EntityStatus, NetIdMessages, NetMessages } from "../config/net_messages";
import { Vec2XY } from "../utils/math_utils";

interface StickState {
    angle: number
    state: boolean;
}


interface MovingData {
    start: Vec2XY
    time: number;
    speed: number;
}

export type IUser = ReturnType<typeof User>;

export function User(id: number, is_male: boolean, nick: string, speed: number) {
    const stick_state: StickState = { angle: 0, state: false };
    let status = EntityStatus.IDLE;
    let status_moving: MovingData | undefined;
    const position = { x: 0, y: 0 };

    function load_state(x: number, y: number, _angle: number) {
        position.x = x;
        position.y = y;
        stick_state.angle = _angle;
        log("SET", x, y, _angle);
    }

    function on_input_stick(data: NetMessages[NetIdMessages.CS_INPUT_STICK]) {
        stick_state.state = data.state == 1;
        if (stick_state.state) {
            stick_state.angle = data.angle;
            status = EntityStatus.MOVING;
            status_moving = { start: { x: position.x, y: position.y }, time: System.now(), speed };
        }
        else {
            status = EntityStatus.IDLE;
            status_moving = undefined;
        }
    }

    function update(dt: number) {
        if (status == EntityStatus.MOVING && status_moving) {
            const time = System.now() - status_moving.time;
            const dx = Math.cos(stick_state.angle / 180 * Math.PI) * status_moving.speed * time;
            const dy = Math.sin(stick_state.angle / 180 * Math.PI) * status_moving.speed * time;
            position.x = status_moving.start.x + dx;
            position.y = status_moving.start.y + dy;
        }
    }

    function get_state(): EntityFullState {
        return { id, position, angle: stick_state.angle, nick, status, status_data: status_moving, male: is_male ? 1 : 0, speed };
    }

    function get_id() {
        return id
    }


    return { load_state, on_input_stick, update, get_state, get_id };
}