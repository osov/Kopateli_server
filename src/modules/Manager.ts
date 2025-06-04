/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { _GAME_CONFIG } from "../config/game";
import { register_system } from "./System";
import { register_log } from "./Log";
import { register_event_bus } from "./EventBus";
import { register_redis } from "./Redis";
import { register_database } from "./Database";
import { register_users } from "./Users";
import { _UserMessages } from "../config/event_messages";


/*
    Основной модуль для подгрузки остальных, доступен по объекту Manager
    также глобально доступна функция to_hash которая ограничит список доступных для отправки сообщений
    при проверке в on_message, например  if (message_id == to_hash('MANAGER_READY'))
*/

declare global {
    type UserMessages = _UserMessages;
    const GAME_CONFIG: typeof _GAME_CONFIG;
}


export async function register_manager() {
    (global as any).GAME_CONFIG = _GAME_CONFIG;
    await ManagerModule().init();
}


function ManagerModule() {

    async function init() {
        register_system();
        register_log();
        register_event_bus();
        register_users();
        //await register_redis();
        //await register_database();
    }

    return { init };
}


