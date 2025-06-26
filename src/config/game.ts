import { IGameConfig } from "./types";

export const _GAME_CONFIG: IGameConfig = {
    max_length_nick: 20,
    HOME_SCALAR: 0.35,

    locations: {
        main: {
            layer: 9,
            x: 201,
            y: -156,
            zones: []
        },
        dump: {
            layer: 6,
            x: 57,
            y: -76,
            zones: []
        },
        home_mechanic: {
            layer: 3,
            x: 28 / 0.35,
            y: -38 / 0.35,
            zones: []
        },
        home_bar: {
            layer: 2,
            x: 37,
            y: -110,
            zones: []
        },
        home_lombard: {
            layer: 2,
            x: -177.8,
            y: -330.2,
            zones: []
        },
        home_shop: {
            layer: 2,
            x: -177.8,
            y: -330.2,
            zones: []
        },
        location_1: {
            layer: 6,
            x: 166.7,
            y: -84.8,
            zones: []
        },
        location_tutorial: {
            layer: 5,
            x: 166.7,
            y: -84.8,
            zones: []
        },
    }
};

