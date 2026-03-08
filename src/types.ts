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

export interface CanvasTransform {
    panX: number;
    panY: number;
    zoom: number;
    playSpaceLeft: number;
    playSpaceTop: number;
}

export interface SerializedModule {
    key: string;
    type: string;
    inputOnly: boolean;
    position: Point;
    params: Record<string, unknown>;
    displayName?: string;
}

export interface SerializedConnection {
    fromModID: string;
    toModID: string;
}

export interface MIDICCMapping {
    kind: 'cc';
    channel: number;
    cc: number;
    moduleKey: string;
    paramKey: string;
    min: number;
    max: number;
}

export interface MIDINoteMapping {
    kind: 'note';
    channel: number;
    moduleKey: string;
    paramKey: 'frequency';
}

export interface MIDIGateMapping {
    kind: 'gate';
    channel: number;
    moduleKey: string;
}

export type MIDIMapping = MIDICCMapping | MIDINoteMapping | MIDIGateMapping;

export interface ModuleGroup {
    id: string;
    name: string;
    moduleKeys: string[];
}

export interface SerializedGroup {
    id: string;
    name: string;
    moduleKeys: string[];
}

export interface Preset {
    name: string;
    modules: SerializedModule[];
    connections: SerializedConnection[];
    midiMappings?: { mappings: MIDIMapping[] };
    groups?: SerializedGroup[];
}

export interface HistoryEntry {
    modules: SerializedModule[];
    connections: SerializedConnection[];
    groups?: SerializedGroup[];
}
