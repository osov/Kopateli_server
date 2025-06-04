export type NetMessages = {
    CS_Connect: { id_session: string, hash: string }, //Первичное соединение
    SC_Init: { server_time: number, id_user: number, data?: any }, // Инициализация в игровой комнате
    SC_Close: {}, // Закрыто соединение с комнатой
    SC_Join: { id_user: number, nick: string }, // Вошел в игровую комнату
    SC_Leave: { id_user: number }, // Покинул игровую комнату
    CS_Ping: { client_time: number },
    SC_Pong: { client_time: number, server_time: number },
    SC_Test:{users:number,id_pack:number,data:number}
};