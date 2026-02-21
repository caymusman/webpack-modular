import { NumericParam, EnumParam, BoolParam } from '../model/Param';
import { createModule } from '../model/index';
import { GainModule } from '../model/modules/GainModule';
import { OscillatorModule } from '../model/modules/OscillatorModule';
import { FilterModule } from '../model/modules/FilterModule';
import { PannerModule } from '../model/modules/PannerModule';
import { ADSRModule } from '../model/modules/ADSRModule';
import { DelayModule } from '../model/modules/DelayModule';
import { DistortionModule } from '../model/modules/DistortionModule';
import { ReverbModule } from '../model/modules/ReverbModule';
import { AudioInputModule } from '../model/modules/AudioInputModule';
import { RecorderModule } from '../model/modules/RecorderModule';
import { CompressorModule } from '../model/modules/CompressorModule';
import { NoiseModule } from '../model/modules/NoiseModule';
import { LFOModule } from '../model/modules/LFOModule';
import { SequencerModule } from '../model/modules/SequencerModule';

describe('NumericParam', () => {
    test('stores and retrieves value', () => {
        const p = new NumericParam(0.5, 0, 1);
        expect(p.value).toBe(0.5);
        p.value = 0.8;
        expect(p.value).toBe(0.8);
    });

    test('clamps to min/max', () => {
        const p = new NumericParam(5, 0, 10);
        p.value = -5;
        expect(p.value).toBe(0);
        p.value = 20;
        expect(p.value).toBe(10);
    });

    test('rejects NaN', () => {
        const p = new NumericParam(5, 0, 10);
        p.value = NaN;
        expect(p.value).toBe(5);
    });

    test('subscribe notifies on change', () => {
        const p = new NumericParam(0, 0, 1);
        const fn = vi.fn();
        p.subscribe(fn);
        p.value = 0.5;
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('subscribe does not notify when value unchanged', () => {
        const p = new NumericParam(0.5, 0, 1);
        const fn = vi.fn();
        p.subscribe(fn);
        p.value = 0.5;
        expect(fn).not.toHaveBeenCalled();
    });

    test('unsubscribe stops notifications', () => {
        const p = new NumericParam(0, 0, 1);
        const fn = vi.fn();
        const unsub = p.subscribe(fn);
        unsub();
        p.value = 0.5;
        expect(fn).not.toHaveBeenCalled();
    });

    test('reset restores default', () => {
        const p = new NumericParam(0.5, 0, 1);
        p.value = 0.9;
        p.reset();
        expect(p.value).toBe(0.5);
    });

    test('serialize/deserialize round-trip', () => {
        const p = new NumericParam(0, 0, 100);
        p.value = 42;
        const s = p.serialize();
        const p2 = new NumericParam(0, 0, 100);
        p2.deserialize(s);
        expect(p2.value).toBe(42);
    });
});

describe('EnumParam', () => {
    const options = ['a', 'b', 'c'] as const;

    test('stores and retrieves value', () => {
        const p = new EnumParam('a', options);
        expect(p.value).toBe('a');
        p.value = 'b';
        expect(p.value).toBe('b');
    });

    test('rejects invalid option', () => {
        const p = new EnumParam('a', options);
        p.value = 'invalid' as (typeof options)[number];
        expect(p.value).toBe('a');
    });

    test('subscribe notifies on change', () => {
        const p = new EnumParam('a', options);
        const fn = vi.fn();
        p.subscribe(fn);
        p.value = 'c';
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('reset restores default', () => {
        const p = new EnumParam('a', options);
        p.value = 'c';
        p.reset();
        expect(p.value).toBe('a');
    });

    test('serialize/deserialize round-trip', () => {
        const p = new EnumParam('a', options);
        p.value = 'b';
        const s = p.serialize();
        const p2 = new EnumParam('a', options);
        p2.deserialize(s);
        expect(p2.value).toBe('b');
    });
});

describe('BoolParam', () => {
    test('stores and retrieves value', () => {
        const p = new BoolParam(false);
        expect(p.value).toBe(false);
        p.value = true;
        expect(p.value).toBe(true);
    });

    test('subscribe notifies on change', () => {
        const p = new BoolParam(false);
        const fn = vi.fn();
        p.subscribe(fn);
        p.value = true;
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('reset restores default', () => {
        const p = new BoolParam(false);
        p.value = true;
        p.reset();
        expect(p.value).toBe(false);
    });
});

describe('createModule factory', () => {
    test('creates all module types', () => {
        const types = [
            'Gain',
            'Oscillator',
            'Filter',
            'Panner',
            'ADSR',
            'Delay',
            'Distortion',
            'Reverb',
            'AudioInput',
            'Recorder',
            'Compressor',
            'Noise',
            'LFO',
            'Sequencer',
        ];
        types.forEach((type) => {
            const mod = createModule(type);
            expect(mod.type).toBe(type);
        });
    });

    test('throws for unknown type', () => {
        expect(() => createModule('Unknown')).toThrow('Unknown module type');
    });
});

describe('SynthModule serialize/deserialize', () => {
    test('GainModule round-trip', () => {
        const m1 = new GainModule();
        m1.params.gain.value = 0.7;
        const data = m1.serialize();
        const m2 = new GainModule();
        m2.deserialize(data);
        expect(m2.params.gain.value).toBe(0.7);
    });

    test('FilterModule round-trip', () => {
        const m1 = new FilterModule();
        m1.params.filterType.value = 'highpass';
        m1.params.frequency.value = 1000;
        m1.params.q.value = 5;
        m1.params.gain.value = -10;
        const data = m1.serialize();
        const m2 = new FilterModule();
        m2.deserialize(data);
        expect(m2.params.filterType.value).toBe('highpass');
        expect(m2.params.frequency.value).toBe(1000);
        expect(m2.params.q.value).toBe(5);
        expect(m2.params.gain.value).toBe(-10);
    });

    test('OscillatorModule round-trip', () => {
        const m1 = new OscillatorModule();
        m1.params.waveType.value = 'sawtooth';
        m1.params.frequency.value = 880;
        m1.params.lfo.value = true;
        m1.params.modDepth.value = 150;
        const data = m1.serialize();
        const m2 = new OscillatorModule();
        m2.deserialize(data);
        expect(m2.params.waveType.value).toBe('sawtooth');
        expect(m2.params.frequency.value).toBe(880);
        expect(m2.params.lfo.value).toBe(true);
        expect(m2.params.modDepth.value).toBe(150);
    });

    test('PannerModule round-trip', () => {
        const m1 = new PannerModule();
        m1.params.pan.value = -0.5;
        const data = m1.serialize();
        const m2 = new PannerModule();
        m2.deserialize(data);
        expect(m2.params.pan.value).toBe(-0.5);
    });

    test('ADSRModule round-trip', () => {
        const m1 = new ADSRModule();
        m1.params.attack.value = 1;
        m1.params.decay.value = 2;
        m1.params.sustain.value = 0.8;
        m1.params.release.value = 3;
        const data = m1.serialize();
        const m2 = new ADSRModule();
        m2.deserialize(data);
        expect(m2.params.attack.value).toBe(1);
        expect(m2.params.decay.value).toBe(2);
        expect(m2.params.sustain.value).toBe(0.8);
        expect(m2.params.release.value).toBe(3);
    });

    test('DelayModule round-trip', () => {
        const m1 = new DelayModule();
        m1.params.delayTime.value = 1.5;
        const data = m1.serialize();
        const m2 = new DelayModule();
        m2.deserialize(data);
        expect(m2.params.delayTime.value).toBe(1.5);
    });

    test('DistortionModule round-trip', () => {
        const m1 = new DistortionModule();
        m1.params.curve.value = 600;
        m1.params.oversample.value = '4x';
        const data = m1.serialize();
        const m2 = new DistortionModule();
        m2.deserialize(data);
        expect(m2.params.curve.value).toBe(600);
        expect(m2.params.oversample.value).toBe('4x');
    });

    test('ReverbModule round-trip', () => {
        const m1 = new ReverbModule();
        m1.params.impulse.value = 'Large';
        const data = m1.serialize();
        const m2 = new ReverbModule();
        m2.deserialize(data);
        expect(m2.params.impulse.value).toBe('Large');
    });

    test('AudioInputModule round-trip', () => {
        const m1 = new AudioInputModule();
        m1.params.gain.value = 0.3;
        const data = m1.serialize();
        const m2 = new AudioInputModule();
        m2.deserialize(data);
        expect(m2.params.gain.value).toBe(0.3);
    });

    test('RecorderModule round-trip (no params)', () => {
        const m1 = new RecorderModule();
        const data = m1.serialize();
        expect(data).toEqual({});
        const m2 = new RecorderModule();
        m2.deserialize(data);
        expect(m2.serialize()).toEqual({});
    });

    test('CompressorModule round-trip', () => {
        const m1 = new CompressorModule();
        m1.params.threshold.value = -40;
        m1.params.knee.value = 20;
        m1.params.ratio.value = 8;
        m1.params.attack.value = 0.01;
        m1.params.release.value = 0.5;
        const data = m1.serialize();
        const m2 = new CompressorModule();
        m2.deserialize(data);
        expect(m2.params.threshold.value).toBe(-40);
        expect(m2.params.knee.value).toBe(20);
        expect(m2.params.ratio.value).toBe(8);
        expect(m2.params.attack.value).toBe(0.01);
        expect(m2.params.release.value).toBe(0.5);
    });

    test('NoiseModule round-trip', () => {
        const m1 = new NoiseModule();
        m1.params.noiseType.value = 'pink';
        m1.params.gain.value = 0.4;
        const data = m1.serialize();
        const m2 = new NoiseModule();
        m2.deserialize(data);
        expect(m2.params.noiseType.value).toBe('pink');
        expect(m2.params.gain.value).toBe(0.4);
    });

    test('LFOModule round-trip', () => {
        const m1 = new LFOModule();
        m1.params.rate.value = 5;
        m1.params.depth.value = 200;
        m1.params.waveType.value = 'triangle';
        const data = m1.serialize();
        const m2 = new LFOModule();
        m2.deserialize(data);
        expect(m2.params.rate.value).toBe(5);
        expect(m2.params.depth.value).toBe(200);
        expect(m2.params.waveType.value).toBe('triangle');
    });

    test('SequencerModule round-trip (params + steps)', () => {
        const m1 = new SequencerModule();
        m1.params.bpm.value = 180;
        m1.steps[0] = 440;
        m1.activeSteps[1] = false;
        const data = m1.serialize();
        const m2 = new SequencerModule();
        m2.deserialize(data);
        expect(m2.params.bpm.value).toBe(180);
        expect(m2.steps[0]).toBe(440);
        expect(m2.activeSteps[1]).toBe(false);
    });
});

describe('SynthModule properties', () => {
    test('GainModule inputOnly is false', () => {
        expect(new GainModule().inputOnly).toBe(false);
    });

    test('OscillatorModule inputOnly is true', () => {
        expect(new OscillatorModule().inputOnly).toBe(true);
    });

    test('AudioInputModule inputOnly is true', () => {
        expect(new AudioInputModule().inputOnly).toBe(true);
    });

    test('getNode throws before init', () => {
        expect(() => new GainModule().getNode()).toThrow('not initialized');
    });

    test('CompressorModule inputOnly is false', () => {
        expect(new CompressorModule().inputOnly).toBe(false);
    });

    test('NoiseModule inputOnly is true', () => {
        expect(new NoiseModule().inputOnly).toBe(true);
    });

    test('LFOModule inputOnly is true', () => {
        expect(new LFOModule().inputOnly).toBe(true);
    });

    test('SequencerModule inputOnly is true', () => {
        expect(new SequencerModule().inputOnly).toBe(true);
    });
});

describe('SequencerModule', () => {
    test('defaults: 8 steps, all active, not running', () => {
        const m = new SequencerModule();
        expect(m.steps.length).toBe(8);
        expect(m.activeSteps.length).toBe(8);
        expect(m.activeSteps.every(Boolean)).toBe(true);
        expect(m.isRunning).toBe(false);
        expect(m.currentStep).toBe(0);
    });

    test('setStepCount grows the array', () => {
        const m = new SequencerModule();
        m.setStepCount(12);
        expect(m.steps.length).toBe(12);
        expect(m.activeSteps.length).toBe(12);
    });

    test('setStepCount shrinks the array', () => {
        const m = new SequencerModule();
        m.setStepCount(4);
        expect(m.steps.length).toBe(4);
        expect(m.activeSteps.length).toBe(4);
    });

    test('setStepCount clamps to minimum of 2', () => {
        const m = new SequencerModule();
        m.setStepCount(0);
        expect(m.steps.length).toBe(2);
    });

    test('setStepCount clamps to maximum of 16', () => {
        const m = new SequencerModule();
        m.setStepCount(20);
        expect(m.steps.length).toBe(16);
    });

    test('setStepCount resets currentStep when out of bounds', () => {
        const m = new SequencerModule();
        // Simulate internal step advancing to step 7
        (m as unknown as { _currentStep: number })._currentStep = 7;
        m.setStepCount(4);
        expect(m.currentStep).toBe(0);
    });

    test('new steps added via setStepCount default to C4', () => {
        const m = new SequencerModule();
        m.setStepCount(10);
        expect(m.steps[8]).toBeCloseTo(261.63, 1);
        expect(m.steps[9]).toBeCloseTo(261.63, 1);
    });

    test('new steps added via setStepCount are active by default', () => {
        const m = new SequencerModule();
        m.setStepCount(10);
        expect(m.activeSteps[8]).toBe(true);
        expect(m.activeSteps[9]).toBe(true);
    });
});
