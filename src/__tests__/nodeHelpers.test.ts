import {
    setParamValue,
    setNodeType,
    setPanValue,
    setDistortionCurve,
    setOversample,
    setConvolverBuffer,
    makeDistortionCurve,
} from '../audio/nodeHelpers';

describe('nodeHelpers', () => {
    test('setParamValue calls setValueAtTime', () => {
        const param = { setValueAtTime: vi.fn() };
        setParamValue(param, 440, 0.5);
        expect(param.setValueAtTime).toHaveBeenCalledWith(440, 0.5);
    });

    test('setNodeType sets the type property', () => {
        const node = { type: 'sine' };
        setNodeType(node, 'sawtooth');
        expect(node.type).toBe('sawtooth');
    });

    test('setPanValue sets pan.value', () => {
        const node = { pan: { value: 0 } };
        setPanValue(node, -0.5);
        expect(node.pan.value).toBe(-0.5);
    });

    test('setDistortionCurve sets the curve property', () => {
        const curve = new Float32Array([1, 2, 3]);
        const node = { curve: null };
        setDistortionCurve(node, curve);
        expect(node.curve).toBe(curve);
    });

    test('setOversample sets the oversample property', () => {
        const node = { oversample: 'none' };
        setOversample(node, '4x');
        expect(node.oversample).toBe('4x');
    });

    test('setConvolverBuffer sets the buffer property', () => {
        const buffer = {};
        const node = { buffer: null };
        setConvolverBuffer(node, buffer);
        expect(node.buffer).toBe(buffer);
    });

    describe('makeDistortionCurve', () => {
        test('returns a Float32Array of 44100 samples', () => {
            const curve = makeDistortionCurve(400);
            expect(curve).toBeInstanceOf(Float32Array);
            expect(curve.length).toBe(44100);
        });

        test('produces different curves for different amounts', () => {
            const curve1 = makeDistortionCurve(100);
            const curve2 = makeDistortionCurve(800);
            // The curves should differ at some sample
            let differ = false;
            for (let i = 0; i < curve1.length; i++) {
                if (curve1[i] !== curve2[i]) {
                    differ = true;
                    break;
                }
            }
            expect(differ).toBe(true);
        });

        test('curve values are finite numbers', () => {
            const curve = makeDistortionCurve(400);
            for (let i = 0; i < curve.length; i++) {
                expect(Number.isFinite(curve[i])).toBe(true);
            }
        });
    });
});
