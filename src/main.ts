// todo проверить дефолд возьмет ли пачку сообщений хоть они и будут разбиты на фрагементы, но потенциально слипнутся в один пакет

import { SERVER_CONFIG } from "./config/server";
import { register_manager } from "./modules/Manager";
import { GameServer } from "./server/game_server";

await register_manager();

const server = GameServer(SERVER_CONFIG.server_port);
await server.start();
