import { md5 } from "js-md5";
import { SERVER_CONFIG } from "../config/server";

export function do_response<T>(data: T) {
    return new Response(JSON.stringify(data), {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*"
        }
    });
}

export function check_hash(id_session: string, hash: string): boolean {
    return md5(id_session + SERVER_CONFIG.salt) == hash;
}