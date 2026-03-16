import {
    serializeInstrument,
    deserializeInstrument,
    saveInstrument,
    loadInstrument,
    listInstruments,
    deleteInstrument,
} from '../utils/instruments';
import { ModuleRecord, PatchCord, ModuleGroup, Instrument } from '../types';
import { GainModule } from '../model/modules/GainModule';
import { OscillatorModule } from '../model/modules/OscillatorModule';
import { FilterModule } from '../model/modules/FilterModule';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
        get length() { return Object.keys(store).length; },
        key: (i: number) => Object.keys(store)[i] ?? null,
    };
})();

beforeEach(() => {
    localStorageMock.clear();
    vi.stubGlobal('localStorage', localStorageMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRecord(key: string, filling: string, x: number, y: number, mod: GainModule | OscillatorModule | FilterModule): ModuleRecord {
    return { myKey: key, filling, name: filling, inputOnly: false, position: { x, y }, module: mod };
}

function makeCord(fromModID: string, tomyKey: string): PatchCord {
    return {
        id: 'cord-' + fromModID,
        fromData: { fromModID, fromLocation: { x: 0, y: 0 }, audio: {} as AudioNode },
        toData: { tomyKey, toLocation: { x: 0, y: 0 }, audio: {} as AudioNode },
    };
}

// ─── serializeInstrument ──────────────────────────────────────────────────────

describe('serializeInstrument', () => {
    test('returns null for unknown groupId', () => {
        const result = serializeInstrument('group-99', new Map(), [], new Map());
        expect(result).toBeNull();
    });

    test('serializes modules belonging to the group', () => {
        const gainMod = new GainModule();
        gainMod.params.gain.value = 0.6;

        const list = new Map<string, ModuleRecord>();
        list.set('Gain 0', makeRecord('Gain 0', 'Gain', 100, 200, gainMod));

        const groups = new Map<string, ModuleGroup>();
        groups.set('group-0', { id: 'group-0', name: 'My Synth', moduleKeys: ['Gain 0'] });

        const result = serializeInstrument('group-0', list, [], groups);

        expect(result).not.toBeNull();
        expect(result!.name).toBe('My Synth');
        expect(result!.modules).toHaveLength(1);
        expect(result!.modules[0].key).toBe('Gain 0');
        expect(result!.modules[0].type).toBe('Gain');
        expect(result!.modules[0].params).toEqual({ gain: 0.6 });
    });

    test('normalizes positions so top-left module is at (0, 0)', () => {
        const list = new Map<string, ModuleRecord>();
        list.set('Gain 0', makeRecord('Gain 0', 'Gain', 300, 400, new GainModule()));
        list.set('Filter 0', makeRecord('Filter 0', 'Filter', 600, 500, new FilterModule()));

        const groups = new Map<string, ModuleGroup>();
        groups.set('group-0', { id: 'group-0', name: 'G', moduleKeys: ['Gain 0', 'Filter 0'] });

        const result = serializeInstrument('group-0', list, [], groups)!;

        const xs = result.modules.map((m) => m.position.x);
        const ys = result.modules.map((m) => m.position.y);
        expect(Math.min(...xs)).toBe(0);
        expect(Math.min(...ys)).toBe(0);
        // Relative offsets preserved
        expect(result.modules.find((m) => m.key === 'Filter 0')!.position.x).toBe(300);
        expect(result.modules.find((m) => m.key === 'Filter 0')!.position.y).toBe(100);
    });

    test('only includes connections where both endpoints are in the group', () => {
        const list = new Map<string, ModuleRecord>();
        list.set('Oscillator 0', makeRecord('Oscillator 0', 'Oscillator', 0, 0, new OscillatorModule()));
        list.set('Filter 0', makeRecord('Filter 0', 'Filter', 200, 0, new FilterModule()));

        const groups = new Map<string, ModuleGroup>();
        groups.set('group-0', { id: 'group-0', name: 'G', moduleKeys: ['Oscillator 0', 'Filter 0'] });

        // Internal connection + one to an outside module
        const cords: PatchCord[] = [
            makeCord('Oscillator 0', 'Filter 0'),
            makeCord('Filter 0', 'Gain 0'), // Gain 0 is outside the group
        ];

        const result = serializeInstrument('group-0', list, cords, groups)!;

        expect(result.connections).toHaveLength(1);
        expect(result.connections[0]).toEqual({ fromModID: 'Oscillator 0', toModID: 'Filter 0' });
    });

    test('excludes connections where the source is outside the group', () => {
        const list = new Map<string, ModuleRecord>();
        list.set('Filter 0', makeRecord('Filter 0', 'Filter', 0, 0, new FilterModule()));

        const groups = new Map<string, ModuleGroup>();
        groups.set('group-0', { id: 'group-0', name: 'G', moduleKeys: ['Filter 0'] });

        const cords: PatchCord[] = [
            makeCord('Oscillator 99', 'Filter 0'), // source outside group
        ];

        const result = serializeInstrument('group-0', list, cords, groups)!;
        expect(result.connections).toHaveLength(0);
    });

    test('includes param-suffix connections (toModID with " param")', () => {
        const list = new Map<string, ModuleRecord>();
        list.set('Oscillator 0', makeRecord('Oscillator 0', 'Oscillator', 0, 0, new OscillatorModule()));
        list.set('Filter 0', makeRecord('Filter 0', 'Filter', 200, 0, new FilterModule()));

        const groups = new Map<string, ModuleGroup>();
        groups.set('group-0', { id: 'group-0', name: 'G', moduleKeys: ['Oscillator 0', 'Filter 0'] });

        const cords: PatchCord[] = [
            makeCord('Oscillator 0', 'Filter 0 param'),
        ];

        const result = serializeInstrument('group-0', list, cords, groups)!;
        expect(result.connections).toHaveLength(1);
        expect(result.connections[0].toModID).toBe('Filter 0 param');
    });

    test('includes pipe-suffix connections (toModID with "|ch...")', () => {
        const list = new Map<string, ModuleRecord>();
        list.set('Oscillator 0', makeRecord('Oscillator 0', 'Oscillator', 0, 0, new OscillatorModule()));
        list.set('Switch 0', makeRecord('Switch 0', 'Switch', 200, 0, new GainModule()));

        const groups = new Map<string, ModuleGroup>();
        groups.set('group-0', { id: 'group-0', name: 'G', moduleKeys: ['Oscillator 0', 'Switch 0'] });

        const cords: PatchCord[] = [
            makeCord('Oscillator 0', 'Switch 0|ch0inputInner'),
        ];

        const result = serializeInstrument('group-0', list, cords, groups)!;
        expect(result.connections).toHaveLength(1);
        expect(result.connections[0].toModID).toBe('Switch 0|ch0inputInner');
    });

    test('skips cords without toData', () => {
        const list = new Map<string, ModuleRecord>();
        list.set('Gain 0', makeRecord('Gain 0', 'Gain', 0, 0, new GainModule()));

        const groups = new Map<string, ModuleGroup>();
        groups.set('group-0', { id: 'group-0', name: 'G', moduleKeys: ['Gain 0'] });

        const cords: PatchCord[] = [{
            id: 'dangling',
            fromData: { fromModID: 'Gain 0', fromLocation: { x: 0, y: 0 }, audio: {} as AudioNode },
            toData: null,
        }];

        const result = serializeInstrument('group-0', list, cords, groups)!;
        expect(result.connections).toHaveLength(0);
    });

    test('includes displayName when module.name differs from filling', () => {
        const list = new Map<string, ModuleRecord>();
        const gainMod = new GainModule();
        list.set('Gain 0', {
            myKey: 'Gain 0',
            filling: 'Gain',
            name: 'Sub Amp',   // custom name
            inputOnly: false,
            position: { x: 0, y: 0 },
            module: gainMod,
        });

        const groups = new Map<string, ModuleGroup>();
        groups.set('group-0', { id: 'group-0', name: 'G', moduleKeys: ['Gain 0'] });

        const result = serializeInstrument('group-0', list, [], groups)!;
        expect(result.modules[0].displayName).toBe('Sub Amp');
    });

    test('omits displayName when module.name equals filling', () => {
        const list = new Map<string, ModuleRecord>();
        list.set('Gain 0', makeRecord('Gain 0', 'Gain', 0, 0, new GainModule()));

        const groups = new Map<string, ModuleGroup>();
        groups.set('group-0', { id: 'group-0', name: 'G', moduleKeys: ['Gain 0'] });

        const result = serializeInstrument('group-0', list, [], groups)!;
        expect(result.modules[0].displayName).toBeUndefined();
    });
});

// ─── deserializeInstrument ────────────────────────────────────────────────────

describe('deserializeInstrument', () => {
    test('parses valid instrument JSON', () => {
        const data: Instrument = {
            name: 'Bass',
            modules: [
                { key: 'Oscillator 0', type: 'Oscillator', inputOnly: true, position: { x: 0, y: 0 }, params: { frequency: 110 } },
            ],
            connections: [],
        };
        const result = deserializeInstrument(JSON.stringify(data));
        expect(result).not.toBeNull();
        expect(result!.name).toBe('Bass');
        expect(result!.modules).toHaveLength(1);
    });

    test('returns null for invalid JSON', () => {
        expect(deserializeInstrument('not json')).toBeNull();
        expect(deserializeInstrument('{}')).toBeNull();
        expect(deserializeInstrument('{"name": 123}')).toBeNull();
    });

    test('returns null when modules is not an array', () => {
        const json = JSON.stringify({ name: 'X', modules: 'bad', connections: [] });
        expect(deserializeInstrument(json)).toBeNull();
    });

    test('returns null for invalid module structure', () => {
        const json = JSON.stringify({
            name: 'X',
            modules: [{ key: 99, type: 'Gain', inputOnly: false, position: { x: 0, y: 0 }, params: {} }],
            connections: [],
        });
        expect(deserializeInstrument(json)).toBeNull();
    });

    test('returns null for missing position fields', () => {
        const json = JSON.stringify({
            name: 'X',
            modules: [{ key: 'Gain 0', type: 'Gain', inputOnly: false, position: { x: 0 }, params: {} }],
            connections: [],
        });
        expect(deserializeInstrument(json)).toBeNull();
    });

    test('returns null for invalid connection structure', () => {
        const json = JSON.stringify({
            name: 'X',
            modules: [],
            connections: [{ fromModID: 42, toModID: 'Gain 0' }],
        });
        expect(deserializeInstrument(json)).toBeNull();
    });

    test('round-trip: serialize → JSON.stringify → deserialize preserves data', () => {
        const list = new Map<string, ModuleRecord>();
        const gainMod = new GainModule();
        gainMod.params.gain.value = 0.75;
        list.set('Gain 0', makeRecord('Gain 0', 'Gain', 50, 80, gainMod));

        const groups = new Map<string, ModuleGroup>();
        groups.set('group-0', { id: 'group-0', name: 'My Patch', moduleKeys: ['Gain 0'] });

        const original = serializeInstrument('group-0', list, [], groups)!;
        const restored = deserializeInstrument(JSON.stringify(original));

        expect(restored).toEqual(original);
    });
});

// ─── localStorage helpers ──────────────────────────────────────────────────────

describe('localStorage helpers', () => {
    const sampleInstrument: Instrument = {
        name: 'Lead',
        modules: [
            { key: 'Oscillator 0', type: 'Oscillator', inputOnly: true, position: { x: 0, y: 0 }, params: {} },
        ],
        connections: [],
    };

    test('saveInstrument and loadInstrument round-trip', () => {
        saveInstrument(sampleInstrument);
        const loaded = loadInstrument('Lead');
        expect(loaded).toEqual(sampleInstrument);
    });

    test('loadInstrument returns null for unknown name', () => {
        expect(loadInstrument('nonexistent')).toBeNull();
    });

    test('listInstruments returns sorted names', () => {
        saveInstrument({ ...sampleInstrument, name: 'Zebra' });
        saveInstrument({ ...sampleInstrument, name: 'Alpha' });
        saveInstrument({ ...sampleInstrument, name: 'Middle' });

        expect(listInstruments()).toEqual(['Alpha', 'Middle', 'Zebra']);
    });

    test('listInstruments ignores non-instrument keys', () => {
        localStorage.setItem('presets::SomePreset', '{}');
        localStorage.setItem('other-key', 'value');
        saveInstrument({ ...sampleInstrument, name: 'Bass' });

        expect(listInstruments()).toEqual(['Bass']);
    });

    test('deleteInstrument removes from localStorage', () => {
        saveInstrument({ ...sampleInstrument, name: 'ToDelete' });
        expect(listInstruments()).toContain('ToDelete');

        deleteInstrument('ToDelete');
        expect(listInstruments()).not.toContain('ToDelete');
        expect(loadInstrument('ToDelete')).toBeNull();
    });

    test('saving an instrument with same name overwrites it', () => {
        saveInstrument({ ...sampleInstrument, name: 'Patch', modules: [] });
        saveInstrument({ ...sampleInstrument, name: 'Patch', modules: [
            { key: 'Gain 0', type: 'Gain', inputOnly: false, position: { x: 0, y: 0 }, params: { gain: 0.5 } },
        ]});

        const loaded = loadInstrument('Patch');
        expect(loaded!.modules).toHaveLength(1);
    });
});
