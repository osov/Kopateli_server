
type ScnType = 'go' | 'sprite' | 'component';

interface ScnOtherData {
    size?: number[]
    material_name: string
    material_uniforms: { [key: string]: string | number };
    layers?: number;
    data?: { x: number, y: number }[]
}

export interface ScnItem {
    name: string;
    other_data: ScnOtherData;
    visible: boolean;
    position: number[];
    rotation: number[];
    scale: number[];
    type: ScnType;
    children: ScnItem[];
}

export type ScnData = {
    scene_data: ScnItem[]
};

export interface ZoneData{
    name:string;
    x:number;
    y:number;
    width:number;
    height:number;
}


export interface LocationConfig {
    layer: number;
    x: number;
    y: number;
    zones: ZoneData[]
}

export interface IGameConfig {
    max_length_nick: number;
    HOME_SCALAR: number;
    locations: { [k: string]: LocationConfig };
}