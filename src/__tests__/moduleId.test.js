import { makeModuleId, getModuleType, getBaseModuleId, makeParamKey } from '../utils/moduleId';

describe('moduleId utilities', () => {
    describe('makeModuleId', () => {
        test('combines type and instance number', () => {
            expect(makeModuleId('Oscillator', 0)).toBe('Oscillator 0');
        });

        test('works with different types and numbers', () => {
            expect(makeModuleId('Gain', 3)).toBe('Gain 3');
            expect(makeModuleId('Filter', 12)).toBe('Filter 12');
        });
    });

    describe('getModuleType', () => {
        test('extracts type from module ID', () => {
            expect(getModuleType('Oscillator 0')).toBe('Oscillator');
        });

        test('works with different types', () => {
            expect(getModuleType('AudioInput 5')).toBe('AudioInput');
            expect(getModuleType('Gain 1')).toBe('Gain');
        });
    });

    describe('getBaseModuleId', () => {
        test('extracts base ID from param key', () => {
            expect(getBaseModuleId('Oscillator 0 param')).toBe('Oscillator 0');
        });

        test('returns same for two-part IDs', () => {
            expect(getBaseModuleId('Gain 2')).toBe('Gain 2');
        });
    });

    describe('makeParamKey', () => {
        test('appends param suffix', () => {
            expect(makeParamKey('Oscillator 0')).toBe('Oscillator 0 param');
        });

        test('works with different parent IDs', () => {
            expect(makeParamKey('Gain 5')).toBe('Gain 5 param');
        });
    });

    test('round-trip: makeModuleId -> getModuleType', () => {
        const id = makeModuleId('Delay', 7);
        expect(getModuleType(id)).toBe('Delay');
    });

    test('round-trip: makeModuleId -> makeParamKey -> getBaseModuleId', () => {
        const id = makeModuleId('Oscillator', 3);
        const paramKey = makeParamKey(id);
        expect(getBaseModuleId(paramKey)).toBe(id);
    });
});
