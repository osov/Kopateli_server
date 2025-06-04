/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */


declare global {
    const System: ReturnType<typeof SystemModule>;
}

export function register_system() {
    (global as any).System = SystemModule();
}

function SystemModule() {
    
    function now() {
        return Date.now() / 1000;
    }

    return { now };
}

