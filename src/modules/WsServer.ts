import { ServerWebSocket } from "bun";
import * as cookie_parser from 'cookie';

export type IWsServer<T> = ReturnType<typeof WsServer<T>>;

export function WsServer<T>(port: number,
    on_data: (client: ServerWebSocket<T>, data: String | Buffer) => void,
    on_client_connected: (client: ServerWebSocket<T>) => void,
    on_client_disconnected: (client: ServerWebSocket<T>) => void) {

    type WsClient = ServerWebSocket<T>;

    const server = Bun.serve<T, {}>({
        port,
        fetch(req, server) {
            const cookies_str = req.headers.get("Cookie") || '';
            const cookies = cookie_parser.parse(cookies_str);
            let id_session = '';
            let headers;
            if (cookies.SessionId == undefined) {
                id_session = crypto.randomUUID();
                headers = {
                    "Set-Cookie": `SessionId=${id_session}`,
                };
            }
            else
                id_session = cookies.SessionId;

            const success = server.upgrade(req, {
                headers,
                data: {
                    id_session,
                    id_user: -1,
                    id_room: '',
                    prev_room:'',
                },
            });
            if (success) return undefined;
        },
        websocket: {
            open(ws) {
                ws.subscribe("all");
                on_client_connected(ws);
            },
            close(ws) {
                on_client_disconnected(ws);
            },
            message(ws, msg) {
                on_data(ws, msg);
            },
            perMessageDeflate: false,
            publishToSelf: true,
        },
    });

    function broadcast(data: string | ArrayBuffer) {
        server.publish("all", data);
    }

    function send(client: WsClient, data: string | ArrayBuffer) {
        client.send(data);
    }

    function remove_client_by_socket(client: WsClient) {
        try {
            if (client.readyState == WebSocket.OPEN)
                client.close();
        }
        catch (e) {
            Log.error('remove_client_by_socket', e);
        }
    }

    function get_stats() {
        return { pendingWebSockets: server.pendingWebSockets };
    }


    return { send, broadcast, get_stats, remove_client_by_socket, server }
}