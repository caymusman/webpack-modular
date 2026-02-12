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

export interface ModuleRecord {
    myKey: string;
    filling: string;
    name: string;
    inputOnly: boolean;
}

export type CordCombos = Record<string, string[]>;
