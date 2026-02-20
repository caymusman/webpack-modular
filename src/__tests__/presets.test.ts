import {
    serializePreset,
    deserializePreset,
    saveToLocalStorage,
    loadFromLocalStorage,
    listPresets,
    deletePreset,
} from '../utils/presets';
import { ModuleRecord, PatchCord } from '../types';
import { GainModule } from '../model/modules/GainModule';
import { OscillatorModule } from '../model/modules/OscillatorModule';
import { FilterModule } from '../model/modules/FilterModule';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
        get length() {
            return Object.keys(store).length;
        },
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

describe('serializePreset', () => {
    test('produces correct structure from modules and cords', () => {
        const gainMod = new GainModule();
        gainMod.params.gain.value = 0.7;

        const filterMod = new FilterModule();

        const list = new Map<string, ModuleRecord>();
        list.set('Gain 0', {
            myKey: 'Gain 0',
            filling: 'Gain',
            name: 'Gain',
            inputOnly: false,
            position: { x: 100, y: 200 },
            module: gainMod,
        });
        list.set('Filter 0', {
            myKey: 'Filter 0',
            filling: 'Filter',
            name: 'Filter',
            inputOnly: false,
            position: { x: 300, y: 400 },
            module: filterMod,
        });

        const cords: PatchCord[] = [
            {
                id: 'cord0',
                fromData: { fromModID: 'Gain 0', fromLocation: { x: 0, y: 0 }, audio: {} as AudioNode },
                toData: { tomyKey: 'Filter 0', toLocation: { x: 0, y: 0 }, audio: {} as AudioNode },
            },
        ];

        const preset = serializePreset('Test', list, cords);

        expect(preset.name).toBe('Test');
        expect(preset.modules).toHaveLength(2);
        expect(preset.connections).toHaveLength(1);
        expect(preset.modules[0].key).toBe('Gain 0');
        expect(preset.modules[0].type).toBe('Gain');
        expect(preset.modules[0].position).toEqual({ x: 100, y: 200 });
        expect(preset.modules[0].params).toEqual({ gain: 0.7 });
        expect(preset.connections[0]).toEqual({ fromModID: 'Gain 0', toModID: 'Filter 0' });
    });

    test('captures module params via module.serialize()', () => {
        const oscMod = new OscillatorModule();
        oscMod.params.waveType.value = 'sawtooth';
        oscMod.params.frequency.value = 880;
        oscMod.params.modDepth.value = 100;

        const list = new Map<string, ModuleRecord>();
        list.set('Oscillator 0', {
            myKey: 'Oscillator 0',
            filling: 'Oscillator',
            name: 'Oscillator',
            inputOnly: true,
            position: { x: 0, y: 0 },
            module: oscMod,
        });

        const preset = serializePreset('Osc Test', list, []);
        expect(preset.modules[0].params).toEqual({
            waveType: 'sawtooth',
            frequency: 880,
            lfo: false,
            modDepth: 100,
        });
    });

    test('empty state serializes correctly', () => {
        const preset = serializePreset('Empty', new Map(), []);
        expect(preset.name).toBe('Empty');
        expect(preset.modules).toEqual([]);
        expect(preset.connections).toEqual([]);
    });

    test('param connections (toModID with param) handled correctly', () => {
        const oscMod = new OscillatorModule();
        const list = new Map<string, ModuleRecord>();
        list.set('Oscillator 0', {
            myKey: 'Oscillator 0',
            filling: 'Oscillator',
            name: 'Oscillator',
            inputOnly: true,
            position: { x: 0, y: 0 },
            module: oscMod,
        });

        const cords: PatchCord[] = [
            {
                id: 'cord0',
                fromData: { fromModID: 'Gain 0', fromLocation: { x: 0, y: 0 }, audio: {} as AudioNode },
                toData: { tomyKey: 'Oscillator 0 param', toLocation: { x: 0, y: 0 }, audio: {} as AudioNode },
            },
        ];

        const preset = serializePreset('Param Test', list, cords);
        expect(preset.connections[0].toModID).toBe('Oscillator 0 param');
    });

    test('cords without toData are excluded', () => {
        const list = new Map<string, ModuleRecord>();
        const cords: PatchCord[] = [
            {
                id: 'cord0',
                fromData: { fromModID: 'Gain 0', fromLocation: { x: 0, y: 0 }, audio: {} as AudioNode },
                toData: null,
            },
        ];

        const preset = serializePreset('Partial', list, cords);
        expect(preset.connections).toEqual([]);
    });
});

describe('deserializePreset', () => {
    test('parses valid JSON to typed Preset', () => {
        const json = JSON.stringify({
            name: 'Test',
            modules: [
                { key: 'Gain 0', type: 'Gain', inputOnly: false, position: { x: 10, y: 20 }, params: { gain: 0.5 } },
            ],
            connections: [{ fromModID: 'Gain 0', toModID: 'Filter 0' }],
        });

        const result = deserializePreset(json);
        expect(result).not.toBeNull();
        expect(result!.name).toBe('Test');
        expect(result!.modules).toHaveLength(1);
        expect(result!.connections).toHaveLength(1);
    });

    test('returns null for malformed JSON', () => {
        expect(deserializePreset('not json')).toBeNull();
        expect(deserializePreset('{}')).toBeNull();
        expect(deserializePreset('{"name": 123}')).toBeNull();
        expect(deserializePreset('{"name": "x", "modules": "bad", "connections": []}')).toBeNull();
    });

    test('returns null for invalid module structure', () => {
        const json = JSON.stringify({
            name: 'Bad',
            modules: [{ key: 123, type: 'Gain', inputOnly: false, position: { x: 0, y: 0 }, params: {} }],
            connections: [],
        });
        expect(deserializePreset(json)).toBeNull();
    });

    test('returns null for invalid connection structure', () => {
        const json = JSON.stringify({
            name: 'Bad',
            modules: [],
            connections: [{ fromModID: 123, toModID: 'Gain 0' }],
        });
        expect(deserializePreset(json)).toBeNull();
    });

    test('round-trip: serialize → JSON.stringify → JSON.parse → deserialize', () => {
        const gainMod = new GainModule();
        gainMod.params.gain.value = 0.8;

        const list = new Map<string, ModuleRecord>();
        list.set('Gain 0', {
            myKey: 'Gain 0',
            filling: 'Gain',
            name: 'Gain',
            inputOnly: false,
            position: { x: 50, y: 60 },
            module: gainMod,
        });

        const original = serializePreset('Round Trip', list, []);
        const jsonStr = JSON.stringify(original);
        const restored = deserializePreset(jsonStr);

        expect(restored).toEqual(original);
    });
});

describe('localStorage helpers', () => {
    test('save and load preset', () => {
        const preset = {
            name: 'My Preset',
            modules: [
                { key: 'Gain 0', type: 'Gain', inputOnly: false, position: { x: 0, y: 0 }, params: { gain: 0.5 } },
            ],
            connections: [],
        };

        saveToLocalStorage(preset);
        const loaded = loadFromLocalStorage('My Preset');
        expect(loaded).toEqual(preset);
    });

    test('loadFromLocalStorage returns null for missing preset', () => {
        expect(loadFromLocalStorage('nonexistent')).toBeNull();
    });

    test('listPresets returns sorted names', () => {
        saveToLocalStorage({ name: 'Zebra', modules: [], connections: [] });
        saveToLocalStorage({ name: 'Alpha', modules: [], connections: [] });
        saveToLocalStorage({ name: 'Middle', modules: [], connections: [] });

        const names = listPresets();
        expect(names).toEqual(['Alpha', 'Middle', 'Zebra']);
    });

    test('deletePreset removes from localStorage', () => {
        saveToLocalStorage({ name: 'ToDelete', modules: [], connections: [] });
        expect(listPresets()).toContain('ToDelete');

        deletePreset('ToDelete');
        expect(listPresets()).not.toContain('ToDelete');
        expect(loadFromLocalStorage('ToDelete')).toBeNull();
    });

    test('listPresets ignores non-preset keys', () => {
        localStorage.setItem('other-key', 'value');
        saveToLocalStorage({ name: 'Test', modules: [], connections: [] });

        const names = listPresets();
        expect(names).toEqual(['Test']);
    });
});
