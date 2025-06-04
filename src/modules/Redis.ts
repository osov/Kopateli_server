import { createClient, RedisClientType, RedisDefaultModules, RedisFunctions, RedisModules, RedisScripts } from "redis";
import { SERVER_CONFIG } from "../config/server";

declare global {
    const Redis: RedisClientType<RedisDefaultModules & RedisModules, RedisFunctions, RedisScripts>;
}

export async function register_redis() {
    (global as any).Redis = await createClient({url: SERVER_CONFIG.redis_url})
        .on('error', err => Log.error('Redis Client Error', err))
        .connect();
}
