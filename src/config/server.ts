export const SERVER_CONFIG = {
    server_port: 5000,
    
    database_config: {
        host: 'localhost',
        user: 'root',
        database: 'db',
        password: ''
    },
    database_ping_interval: 10 * 60 * 1000,

    redis_url: "",

    salt: 'session_salt',
    
};

