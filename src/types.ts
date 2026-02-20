export interface Point {
    x: number;
    y: number;
}

export interface CordFromData {
    fromModID: string;
    fromLocation: Point;
    audio: AudioNode;
}

export interface CordToData {
    tomyKey: string;
    toLocation: Point;
    audio: AudioNode | AudioParam;
}

export interface PatchCord {
    id: string;
    fromData: CordFromData;
    toData: CordToData | null;
}

import type { SynthModule } from './model/SynthModule';

export interface ModuleRecord {
    myKey: string;
    filling: string;
    name: string;
    inputOnly: boolean;
    position: Point;
    module: SynthModule;
}

export type CordCombos = Record<string, string[]>;

export interface SerializedModule {
    key: string;
    type: string;
    inputOnly: boolean;
    position: Point;
    params: Record<string, unknown>;
}

export interface SerializedConnection {
    fromModID: string;
    toModID: string;
}

export interface Preset {
    name: string;
    modules: SerializedModule[];
    connections: SerializedConnection[];
}
