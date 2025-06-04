import mysql, { Connection } from "mysql2/promise";
import { SERVER_CONFIG } from "../config/server";

declare global {
    const Database: Connection;
}

export async function register_database() {
    const connection = await mysql.createConnection(SERVER_CONFIG.database_config);
    await connection.connect();
    setInterval(() => connection.ping(), SERVER_CONFIG.database_ping_interval);
    (global as any).Database = connection;
}
