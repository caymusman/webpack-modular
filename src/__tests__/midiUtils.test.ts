import {
    midiNoteToHz,
    scaleCCValue,
    makeMIDILearnId,
    parseMIDILearnId,
    makeMIDIMappingKey,
    makeMIDINoteKey,
} from '../midi/midiUtils';

describe('midiNoteToHz', () => {
    test('A4 (note 69) is 440 Hz', () => {
        expect(midiNoteToHz(69)).toBeCloseTo(440, 5);
    });

    test('A3 (note 57) is 220 Hz', () => {
        expect(midiNoteToHz(57)).toBeCloseTo(220, 5);
    });

    test('A5 (note 81) is 880 Hz', () => {
        expect(midiNoteToHz(81)).toBeCloseTo(880, 5);
    });

    test('C4 (note 60) is approximately 261.63 Hz', () => {
        expect(midiNoteToHz(60)).toBeCloseTo(261.63, 1);
    });

    test('note 0 produces a positive frequency', () => {
        expect(midiNoteToHz(0)).toBeGreaterThan(0);
    });

    test('note 127 produces a high frequency', () => {
        expect(midiNoteToHz(127)).toBeGreaterThan(10000);
    });

    test('each semitone up doubles frequency after 12 steps', () => {
        const base = midiNoteToHz(48);
        const octaveUp = midiNoteToHz(60);
        expect(octaveUp / base).toBeCloseTo(2, 5);
    });
});

describe('scaleCCValue', () => {
    test('0 maps to min', () => {
        expect(scaleCCValue(0, 0, 1)).toBe(0);
    });

    test('127 maps to max', () => {
        expect(scaleCCValue(127, 0, 1)).toBeCloseTo(1, 5);
    });

    test('64 maps to midpoint of 0–1 range', () => {
        expect(scaleCCValue(64, 0, 1)).toBeCloseTo(0.5, 1);
    });

    test('scales to arbitrary min/max range', () => {
        expect(scaleCCValue(0, -100, 100)).toBe(-100);
        expect(scaleCCValue(127, -100, 100)).toBeCloseTo(100, 3);
    });

    test('scales to frequency range', () => {
        const hz = scaleCCValue(127, 20, 20000);
        expect(hz).toBeCloseTo(20000, 3);
        expect(scaleCCValue(0, 20, 20000)).toBe(20);
    });
});

describe('makeMIDILearnId', () => {
    test('joins moduleKey and paramKey with ::', () => {
        expect(makeMIDILearnId('Oscillator 0', 'frequency')).toBe('Oscillator 0::frequency');
    });

    test('works with gate paramKey', () => {
        expect(makeMIDILearnId('ADSR 0', 'gate')).toBe('ADSR 0::gate');
    });
});

describe('parseMIDILearnId', () => {
    test('splits on first :: separator', () => {
        const result = parseMIDILearnId('Oscillator 0::frequency');
        expect(result.moduleKey).toBe('Oscillator 0');
        expect(result.paramKey).toBe('frequency');
    });

    test('returns full string as moduleKey when :: is absent', () => {
        const result = parseMIDILearnId('no-separator');
        expect(result.moduleKey).toBe('no-separator');
        expect(result.paramKey).toBe('');
    });

    test('round-trips with makeMIDILearnId', () => {
        const id = makeMIDILearnId('Filter 2', 'frequency');
        const parsed = parseMIDILearnId(id);
        expect(parsed.moduleKey).toBe('Filter 2');
        expect(parsed.paramKey).toBe('frequency');
    });

    test('handles :: in the param key', () => {
        const result = parseMIDILearnId('Mod 0::a::b');
        expect(result.moduleKey).toBe('Mod 0');
        expect(result.paramKey).toBe('a::b');
    });
});

describe('makeMIDIMappingKey', () => {
    test('encodes channel and cc number', () => {
        expect(makeMIDIMappingKey(0, 7)).toBe('cc:0:7');
        expect(makeMIDIMappingKey(1, 74)).toBe('cc:1:74');
    });

    test('different cc numbers produce different keys', () => {
        expect(makeMIDIMappingKey(0, 1)).not.toBe(makeMIDIMappingKey(0, 2));
    });

    test('different channels produce different keys', () => {
        expect(makeMIDIMappingKey(0, 7)).not.toBe(makeMIDIMappingKey(1, 7));
    });
});

describe('makeMIDINoteKey', () => {
    test('encodes channel', () => {
        expect(makeMIDINoteKey(0)).toBe('note:0');
        expect(makeMIDINoteKey(9)).toBe('note:9');
    });

    test('different channels produce different keys', () => {
        expect(makeMIDINoteKey(0)).not.toBe(makeMIDINoteKey(1));
    });
});
