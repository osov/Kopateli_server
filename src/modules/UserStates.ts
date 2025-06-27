import { UserState } from "./types";


declare global {
    const UserStates: ReturnType<typeof UserStatesModule>;
}

export function register_user_states() {
    (global as any).UserStates = UserStatesModule();
}

export function UserStatesModule() {
    const users: { [id_user: number]: UserState } = {};
    const users_sessions: { [id_session: string]: number } = {};

    function add_user_in_cache(id_session: string, user: UserState | undefined) {
        if (user) {
            users[user.id] = user;
            users_sessions[id_session] = user.id;
        }
    }

    async function create(id_session: string): Promise<UserState | undefined> {
        if (id_session === undefined || id_session === "") return;
        // todo
        //const user = await db_create_new_user(id_session);
        const user = create_fake(id_session);
        add_user_in_cache(id_session, user);
        return user;
    }

    let fid = 0;
    function create_fake(id_session: string) {
        fid++;
        return { id: fid, id_session: id_session, nick: "Игрок " + fid, x: 0, y: 0, angle: 0, gender: 1, speed: 20 };
    }

    async function get_by_id_session(id_session: string): Promise<UserState | undefined> {
        if (id_session === undefined || id_session === "") return;
        let id_user = users_sessions[id_session];
        if (id_user) {
            const user = users[id_user];
            if (user) return user;
        }
        // todo
        return;
        const user = await db_get_user_data_by_id_session(id_session);
        add_user_in_cache(id_session, user);
        return user;
    }


    function get_cached_by_id_user(id_user: number): UserState | undefined {
        return users[id_user];
    }

    async function get_by_id_user(id_user: number, is_force_update = false) {
        if (id_user === undefined) return;
        let user = get_cached_by_id_user(id_user);
        if (user && !is_force_update) return user;
        user = await db_get_user_data_by_id(id_user);
        if (user) {
            add_user_in_cache(user.id_session, user);
            return user;
        }
    }

    function get_cached_by_nick(nick: string): UserState | undefined {
        for (const id_user in users) {
            const user = users[id_user]
            if (user.nick === nick) return user;
        }
    }

    async function set_nick(id_session: string, nick: string) {
        const user = await get_by_id_session(id_session);
        if (user) {
            nick = nick.trim();
            if (nick.length == 0) return false;
            for (let i = 100; i >= 0; i--) {
                const smile = 'AA-' + i;
                nick = nick.split(smile).join('');
            }
            nick = nick.substring(0, GAME_CONFIG.max_length_nick);
            if (user.nick == nick) return false;
            const success = await db_set_user_property(user.id, 'nick', nick);
            if (success) {
                user.nick = nick;
                return true;
            }
        }
        return false;
    }

    function is_exist(nick: string): boolean {
        return get_cached_by_nick(nick) !== undefined;
    }

    async function set_property<T extends keyof UserState>(id_user: number, prop: T, value: UserState[T]) {
        const user = await get_by_id_user(id_user);
        if (user) {
            const success = await db_set_user_property(user.id, prop, value);
            if (success) {
                user[prop] = value;
                return true;
            }
        }
        return false;
    }

    // ------------------------------------------------------
    // DATABASE
    // ------------------------------------------------------

    async function db_get_user_data_by_id_session(id_session: string): Promise<UserState | undefined> {
        try {
            const [results, fields] = await Database.query('SELECT * FROM `users` WHERE `id_session` = ? LIMIT 1', [id_session]);
            const users: UserState[] = results as any as UserState[];
            if (users.length > 0) {
                return users[0];
            }
        } catch (err) {
            Log.error('db_get_user_data_by_id_session', err);
        }
    }

    async function db_get_user_data_by_id(id: number): Promise<UserState | undefined> {
        try {
            const [results, fields] = await Database.query('SELECT * FROM `users` WHERE `id` = ? LIMIT 1', [id]);
            const users: UserState[] = results as any as UserState[];
            if (users.length > 0) {
                return users[0];
            }
        } catch (err) {
            Log.error('db_get_user_data_by_id', err);
        }
    }

    async function db_get_user_data_by_nick(nick: string): Promise<UserState | undefined> {
        try {
            const [results, fields] = await Database.query('SELECT * FROM `users` WHERE `nick` = ? LIMIT 1', [nick]);
            const users: UserState[] = results as any as UserState[];
            if (users.length > 0) {
                return users[0];
            }
        } catch (err) {
            Log.error('db_get_user_data_by_nick', err);
        }
    }

    async function db_create_new_user(id_session: string, prefix = "Игрок"): Promise<UserState | undefined> {
        let id_user = 1;
        try {
            const [results, fields] = await Database.query('SELECT id FROM `users` ORDER BY id DESC LIMIT 1');
            const users = results as any as UserState[];
            if (users.length > 0) {
                id_user = users[0].id + 1;
            }
        } catch (err) {
            Log.error('create_new_user', err);
        }
        let is_exist = false;
        let counter = 1;
        let postfix = "";
        do {
            is_exist = false;
            const nick = prefix + " " + id_user + postfix;
            try {
                const [result_insert] = await Database.query('INSERT INTO `users` (`id_session`, `nick`, `reg_date`, `last_online`) VALUES (?,?,NOW(),NOW())',
                    [id_session, nick]);
                if ("insertId" in result_insert) {
                    const last_inserted_id = result_insert.insertId;
                    const [results, fields] = await Database.query('SELECT * FROM `users` WHERE `id`= ?', [last_inserted_id]);
                    const users = results as any as UserState[];
                    if (users.length > 0) {
                        return users[0];
                    }
                }
            } catch (err) {
                postfix = "_" + counter;
                is_exist = true;
                counter++;
            }
        } while (is_exist)
    }

    async function db_set_user_property<T extends keyof UserState>(id_user: number, prop: T, value: UserState[T]) {
        try {
            await Database.query('UPDATE `users` SET `' + prop + '` = ? WHERE `id` = ? LIMIT 1', [value, id_user]);
            return true;
        } catch (err) {
            Log.error('db_set_user_property', err);
        }
        return false;
    }


    return {
        create,
        get_by_id_session,
        get_cached_by_id_user,
        get_by_id_user,
        set_nick,
        is_exist,
        set_property,
        users_sessions,
        users
    }
}