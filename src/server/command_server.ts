import { heapStats } from "bun:jsc";
import { do_response } from "./common";
import { IClients } from "../utils/clients";
import { IWsServer } from "../modules/WsServer";
import { ExtWebSocket } from "../modules/types";

export type ICommandServer = ReturnType<typeof CommandServer>;

export function CommandServer(port: number, clients: IClients, ws_server: IWsServer<ExtWebSocket>) {
    Bun.serve({
        port,
        async fetch(req) {
            const url = new URL(req.url);
            if (url.pathname.includes('favicon'))
                return do_response("");
            // GET
            const cmd_get = url.searchParams.get('cmd');
            if (cmd_get == 'heap') {
                return do_response(heapStats());
            }
            else if (cmd_get == 'gc') {
                Bun.gc(true);
            }
            else if (cmd_get == 'get_stats') {
                return do_response({ users: Object.keys(clients.connected_sockets).length });
            }
            else if (cmd_get == 'socket_list') {
                return do_response(ws_server.get_stats());
            }
            else if (cmd_get == 'get_sessions') {
                return do_response(Users.users_sessions);
            }
            else if (cmd_get == 'get_users') {
                return do_response(Users.users);
            }
            else if (cmd_get == 'users_sessions') {
                return do_response(Users.users_sessions);
            }
            else if (cmd_get == 'del_cache_id_user') {
                const id = url.searchParams.get('id') || '';
                const user = Users.get_cached_by_id_user(parseInt(id));
                if (!user)
                    return do_response({ result: 'not found', id });
                delete Users.users[user.id];
                delete Users.users_sessions[user.id_session];
                return do_response({ result: 'ok', id });
            }
            else if (cmd_get == 'update_user') {
                const result = await Users.get_by_id_user(parseInt(url.searchParams.get('id')!), true);
                return do_response({ result });
            }
            else if (cmd_get == 'get_user') {
                return do_response(await Users.get_by_id_user(parseInt(url.searchParams.get('id')!)));
            }
            return do_response("403");
        }
    });
}