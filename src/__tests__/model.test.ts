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
import { SwitchModule } from '../model/modules/SwitchModule';
import { AudioClipModule } from '../model/modules/AudioClipModule';

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
            'Switch',
            'AudioClip',
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

    test('rateCVDepth param has default 60 and range 0-200', () => {
        const m = new SequencerModule();
        expect(m.params.rateCVDepth.value).toBe(60);
        expect(m.params.rateCVDepth.min).toBe(0);
        expect(m.params.rateCVDepth.max).toBe(200);
    });

    test('getParamNode returns _rateModInput after init', () => {
        const m = new SequencerModule();
        m.init(new AudioContext());
        const paramNode = m.getParamNode();
        expect(paramNode).not.toBeNull();
        expect(paramNode).not.toBeUndefined();
        expect(typeof paramNode!.connect).toBe('function'); // it's an AudioNode
        expect(paramNode).not.toBe(m.getNode()); // not the main output gain node
        m.dispose();
    });

    test('inputOnly is true (source module, no audio-through dock)', () => {
        const m = new SequencerModule();
        expect(m.inputOnly).toBe(true);
    });
});

describe('ADSRModule triggerAttack / triggerRelease', () => {
    function makeInitedADSR() {
        const m = new ADSRModule();
        m.init(new AudioContext());
        return m;
    }

    test('triggerAttack calls cancelScheduledValues on gain', () => {
        const m = makeInitedADSR();
        const gain = (m.getNode() as GainNode).gain;
        m.triggerAttack();
        expect(gain.cancelScheduledValues).toHaveBeenCalled();
    });

    test('triggerAttack schedules attack and sustain setTargetAtTime calls', () => {
        const m = makeInitedADSR();
        const gain = (m.getNode() as GainNode).gain;
        m.params.attack.value = 0.1;
        m.params.sustain.value = 0.7;
        m.triggerAttack();
        // Should call setTargetAtTime twice: once for attack ramp, once for sustain
        expect(gain.setTargetAtTime).toHaveBeenCalledTimes(2);
        const [firstCall, secondCall] = (gain.setTargetAtTime as ReturnType<typeof vi.fn>).mock.calls;
        expect(firstCall[0]).toBeCloseTo(0.9); // peak level
        expect(secondCall[0]).toBeCloseTo(0.7); // sustain level
    });

    test('triggerRelease schedules a decay to near-zero', () => {
        const m = makeInitedADSR();
        const gain = (m.getNode() as GainNode).gain;
        m.params.release.value = 0.5;
        m.triggerRelease();
        expect(gain.setTargetAtTime).toHaveBeenCalledTimes(1);
        const [level] = (gain.setTargetAtTime as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(level).toBeCloseTo(0.001);
    });

    test('triggerAttack before init does not throw', () => {
        const m = new ADSRModule();
        expect(() => m.triggerAttack()).not.toThrow();
    });

    test('triggerRelease before init does not throw', () => {
        const m = new ADSRModule();
        expect(() => m.triggerRelease()).not.toThrow();
    });
});

describe('SwitchModule', () => {
    function makeInited() {
        const m = new SwitchModule();
        m.init(new AudioContext());
        return m;
    }

    test('type is Switch and inputOnly is true', () => {
        const m = new SwitchModule();
        expect(m.type).toBe('Switch');
        expect(m.inputOnly).toBe(true);
    });

    test('has channelCount, activeChannel, and rate params', () => {
        const m = new SwitchModule();
        expect(m.params.channelCount).toBeDefined();
        expect(m.params.activeChannel).toBeDefined();
        expect(m.params.rate).toBeDefined();
        expect(m.params.channelCount.value).toBe(2);
        expect(m.params.activeChannel.value).toBe(0);
        expect(m.params.rate.value).toBe(0);
    });

    test('after init, allocates 4 channel gains', () => {
        const m = makeInited();
        expect(m.channelGains.length).toBe(4);
    });

    test('after init, channel 0 gain is initialized to 1 and others to 0', () => {
        // createGainNode uses gain.gain.setValueAtTime (mock fn) not direct .value assignment
        const m = makeInited();
        expect(m.channelGains[0].gain.setValueAtTime).toHaveBeenCalledWith(1, expect.any(Number));
        expect(m.channelGains[1].gain.setValueAtTime).toHaveBeenCalledWith(0, expect.any(Number));
        expect(m.channelGains[2].gain.setValueAtTime).toHaveBeenCalledWith(0, expect.any(Number));
        expect(m.channelGains[3].gain.setValueAtTime).toHaveBeenCalledWith(0, expect.any(Number));
    });

    test('after init, getChannelGain(0) returns a GainNode', () => {
        const m = makeInited();
        const g = m.getChannelGain(0);
        expect(g).toBeDefined();
        expect(typeof g.connect).toBe('function');
    });

    test('getChannelGain returns different nodes for each index', () => {
        const m = makeInited();
        expect(m.getChannelGain(0)).not.toBe(m.getChannelGain(1));
        expect(m.getChannelGain(1)).not.toBe(m.getChannelGain(2));
    });

    test('after init, getParamNode() returns a node', () => {
        const m = makeInited();
        const p = m.getParamNode();
        expect(p).toBeDefined();
    });

    test('setActiveChannel updates activeChannel param', () => {
        const m = makeInited();
        m.setActiveChannel(1);
        expect(m.params.activeChannel.value).toBe(1);
    });

    test('setActiveChannel clamps to channelCount - 1', () => {
        const m = makeInited();
        // count defaults to 2, so max valid channel is 1
        m.setActiveChannel(5);
        expect(m.params.activeChannel.value).toBe(1);
    });

    test('setActiveChannel clamps to 0 at minimum', () => {
        const m = makeInited();
        m.setActiveChannel(-3);
        expect(m.params.activeChannel.value).toBe(0);
    });

    test('setActiveChannel ramps gain to 1 for selected channel, 0 for others', () => {
        const m = makeInited();
        m.params.channelCount.value = 3;
        // Clear spy history from init so we only see the setActiveChannel calls
        m.channelGains.forEach((g) =>
            (g.gain.linearRampToValueAtTime as ReturnType<typeof vi.fn>).mockClear()
        );
        m.setActiveChannel(2);
        expect(m.channelGains[0].gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, expect.any(Number));
        expect(m.channelGains[1].gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, expect.any(Number));
        expect(m.channelGains[2].gain.linearRampToValueAtTime).toHaveBeenCalledWith(1, expect.any(Number));
    });

    test('setActiveChannel does not mutate param when already at that channel', () => {
        const m = makeInited();
        m.setActiveChannel(0);
        const fn = vi.fn();
        m.params.activeChannel.subscribe(fn);
        m.setActiveChannel(0); // same channel — no param change expected
        expect(fn).not.toHaveBeenCalled();
    });

    test('dispose clears the poll interval', () => {
        vi.useFakeTimers();
        const clearSpy = vi.spyOn(global, 'clearInterval');
        const m = makeInited();
        m.dispose();
        expect(clearSpy).toHaveBeenCalled();
        vi.useRealTimers();
        clearSpy.mockRestore();
    });

    test('dispose clears channelGains array', () => {
        const m = makeInited();
        m.dispose();
        expect(m.channelGains.length).toBe(0);
    });

    test('rate param defaults to 0 (auto-cycle off)', () => {
        const m = new SwitchModule();
        expect(m.params.rate.value).toBe(0);
        expect(m.params.rate.min).toBe(0);
        expect(m.params.rate.max).toBe(20);
    });

    test('auto-rate cycling advances channel after interval ticks', () => {
        vi.useFakeTimers();
        const m = makeInited();
        m.params.channelCount.value = 2;
        m.params.rate.value = 20; // 20 Hz → cycles every 50ms

        // Each poll interval is 50ms; at 20Hz the accumulator hits 1.0 after 1s
        // Advance 1100ms (22 ticks × 50ms) to ensure at least one cycle
        vi.advanceTimersByTime(1100);

        // Channel should have advanced from 0
        expect(m.params.activeChannel.value).toBe(1);
        vi.useRealTimers();
        m.dispose();
    });

    test('serialize / deserialize round-trip preserves channelCount and activeChannel', () => {
        const m1 = new SwitchModule();
        m1.params.channelCount.value = 3;
        m1.params.activeChannel.value = 2;
        const data = m1.serialize();
        const m2 = new SwitchModule();
        m2.deserialize(data);
        expect(m2.params.channelCount.value).toBe(3);
        expect(m2.params.activeChannel.value).toBe(2);
    });

    test('serialize / deserialize round-trip preserves rate', () => {
        const m1 = new SwitchModule();
        m1.params.rate.value = 5;
        const data = m1.serialize();
        const m2 = new SwitchModule();
        m2.deserialize(data);
        expect(m2.params.rate.value).toBe(5);
    });

    test('setActiveChannel uses cancelScheduledValues before ramp', () => {
        const m = new SwitchModule();
        m.init(new AudioContext());
        m.channelGains.forEach(g =>
            (g.gain.cancelScheduledValues as ReturnType<typeof vi.fn>).mockClear()
        );
        m.setActiveChannel(1);
        m.channelGains.forEach(g => {
            expect(g.gain.cancelScheduledValues).toHaveBeenCalled();
        });
        m.dispose();
    });
});

describe('AudioClipModule', () => {
    function makeInited() {
        const m = new AudioClipModule();
        m.init(new AudioContext());
        return m;
    }

    function makeMockBuffer(duration = 1): AudioBuffer {
        const sampleRate = 44100;
        return new AudioContext().createBuffer(1, Math.floor(sampleRate * duration), sampleRate) as unknown as AudioBuffer;
    }

    test('type is AudioClip and inputOnly is true', () => {
        const m = new AudioClipModule();
        expect(m.type).toBe('AudioClip');
        expect(m.inputOnly).toBe(true);
    });

    test('after init, getNode() returns a node', () => {
        const m = makeInited();
        expect(() => m.getNode()).not.toThrow();
    });

    test('loadBuffer sets buffer, clipName, trimEnd, and calls onBufferLoad', () => {
        const m = makeInited();
        const buf = makeMockBuffer();
        const onLoad = vi.fn();
        m.onBufferLoad = onLoad;
        m.loadBuffer(buf, 'test.wav');
        expect(m.buffer).toBe(buf);
        expect(m.clipName).toBe('test.wav');
        expect(m.params.trimEnd.value).toBeCloseTo(buf.duration, 1);
        expect(onLoad).toHaveBeenCalledTimes(1);
    });

    test('loadBuffer preserves saved trimEnd when re-linking (trimEnd within duration)', () => {
        const m = makeInited();
        const buf = makeMockBuffer(10); // 10-second buffer
        m.params.trimEnd.value = 7;    // saved value from preset
        m.loadBuffer(buf, 're-link.wav');
        // trimEnd should not be overwritten if it is <= buffer.duration
        expect(m.params.trimEnd.value).toBeCloseTo(7, 2);
    });

    test('loadBuffer resets trimEnd to duration if saved value exceeds new buffer', () => {
        const m = makeInited();
        const buf = makeMockBuffer(5); // 5-second buffer
        m.params.trimEnd.value = 99;   // saved value larger than new buffer duration
        m.loadBuffer(buf, 'clip.wav');
        expect(m.params.trimEnd.value).toBeCloseTo(buf.duration, 1);
    });

    test('loadBuffer resets trimStart to 0 if it would be >= new buffer duration', () => {
        const m = makeInited();
        const buf = makeMockBuffer(2); // 2-second buffer
        m.params.trimStart.value = 5;  // beyond buffer duration
        m.loadBuffer(buf, 'clip.wav');
        expect(m.params.trimStart.value).toBe(0);
    });

    test('play() before buffer is a no-op', () => {
        const m = makeInited();
        expect(() => m.play()).not.toThrow();
        expect(m.isPlaying).toBe(false);
    });

    test('play() with buffer calls createBufferSource and start', () => {
        const m = makeInited();
        const buf = makeMockBuffer();
        m.loadBuffer(buf, 'test.wav');
        const ctx = new AudioContext();
        const srcSpy = vi.spyOn(ctx, 'createBufferSource');
        m['ctx'] = ctx;
        m.play();
        expect(srcSpy).toHaveBeenCalled();
        const src = srcSpy.mock.results[0].value;
        expect(src.start).toHaveBeenCalled();
        expect(m.isPlaying).toBe(true);
    });

    test('play() sets loop and trim props on source node', () => {
        const m = makeInited();
        const buf = makeMockBuffer(10);
        m.params.loop.value = true;
        m.params.trimStart.value = 1;
        m.params.trimEnd.value = 8;
        m.loadBuffer(buf, 'test.wav');
        const ctx = new AudioContext();
        const srcSpy = vi.spyOn(ctx, 'createBufferSource');
        m['ctx'] = ctx;
        m.play();
        const src = srcSpy.mock.results[0].value;
        expect(src.loop).toBe(true);
        expect(src.loopStart).toBe(1);
        expect(src.loopEnd).toBe(8);
    });

    test('stop() stops playback and isPlaying becomes false', () => {
        const m = makeInited();
        const buf = makeMockBuffer();
        m.loadBuffer(buf, 'test.wav');
        m.play();
        m.stop();
        expect(m.isPlaying).toBe(false);
    });

    test('stop() before play does not throw', () => {
        const m = makeInited();
        expect(() => m.stop()).not.toThrow();
    });

    test('onPlaybackEnd callback fires when playback ends naturally', () => {
        const m = makeInited();
        const buf = makeMockBuffer();
        m.loadBuffer(buf, 'test.wav');
        const onEnd = vi.fn();
        m.onPlaybackEnd = onEnd;
        const ctx = new AudioContext();
        const srcSpy = vi.spyOn(ctx, 'createBufferSource');
        m['ctx'] = ctx;
        m.play();
        // Simulate the source node's onended firing
        const src = srcSpy.mock.results[0].value;
        src.onended?.();
        expect(onEnd).toHaveBeenCalledTimes(1);
        expect(m.isPlaying).toBe(false);
    });

    test('updatePlaybackRate does not throw when not playing', () => {
        const m = makeInited();
        expect(() => m.updatePlaybackRate(2.0)).not.toThrow();
    });

    test('updatePlaybackRate updates source node rate when playing', () => {
        const m = makeInited();
        const buf = makeMockBuffer();
        m.loadBuffer(buf, 'test.wav');
        const ctx = new AudioContext();
        const srcSpy = vi.spyOn(ctx, 'createBufferSource');
        m['ctx'] = ctx;
        m.play();
        const src = srcSpy.mock.results[0].value;
        m.updatePlaybackRate(1.5);
        expect(src.playbackRate.value).toBe(1.5);
    });

    test('clear() resets buffer, clipName, and trim params', () => {
        const m = makeInited();
        const buf = makeMockBuffer(5);
        m.loadBuffer(buf, 'clip.wav');
        m.params.trimStart.value = 1;
        m.clear();
        expect(m.buffer).toBeNull();
        expect(m.clipName).toBe('');
        expect(m.params.trimStart.value).toBe(0); // reset to default
        expect(m.params.trimEnd.value).toBe(0);   // reset to default
    });

    test('clear() stops any playing audio', () => {
        const m = makeInited();
        const buf = makeMockBuffer();
        m.loadBuffer(buf, 'clip.wav');
        m.play();
        m.clear();
        expect(m.isPlaying).toBe(false);
    });

    test('serialize includes clipName', () => {
        const m = new AudioClipModule();
        m.clipName = 'my-sample.wav';
        const data = m.serialize();
        expect(data.clipName).toBe('my-sample.wav');
    });

    test('serialize omits clipName when empty string', () => {
        // clipName defaults to '' but is still serialized for restore purposes
        const m = new AudioClipModule();
        const data = m.serialize();
        expect(data.clipName).toBe('');
    });

    test('deserialize restores clipName and trimStart', () => {
        const m1 = new AudioClipModule();
        m1.clipName = 'sample.wav';
        m1.params.trimStart.value = 0.5;
        const data = m1.serialize();
        const m2 = new AudioClipModule();
        m2.deserialize(data);
        expect(m2.clipName).toBe('sample.wav');
        expect(m2.params.trimStart.value).toBeCloseTo(0.5);
    });

    test('deserialize restores trimEnd', () => {
        const m1 = new AudioClipModule();
        m1.params.trimEnd.value = 4.2;
        const data = m1.serialize();
        const m2 = new AudioClipModule();
        m2.deserialize(data);
        expect(m2.params.trimEnd.value).toBeCloseTo(4.2);
    });

    test('deserialize restores loop param', () => {
        const m1 = new AudioClipModule();
        m1.params.loop.value = false;
        const data = m1.serialize();
        const m2 = new AudioClipModule();
        m2.deserialize(data);
        expect(m2.params.loop.value).toBe(false);
    });

    test('deserialize restores playbackRate param', () => {
        const m1 = new AudioClipModule();
        m1.params.playbackRate.value = 1.75;
        const data = m1.serialize();
        const m2 = new AudioClipModule();
        m2.deserialize(data);
        expect(m2.params.playbackRate.value).toBeCloseTo(1.75);
    });

    test('dispose stops playback and does not throw', () => {
        const m = makeInited();
        const buf = makeMockBuffer();
        m.loadBuffer(buf, 'clip.wav');
        m.play();
        expect(() => m.dispose()).not.toThrow();
        expect(m.isPlaying).toBe(false);
    });
});

describe('SynthModule bypass serialization', () => {
    test('serialize omits _bypassed when not bypassed', () => {
        const m = new GainModule();
        const data = m.serialize();
        expect(data._bypassed).toBeUndefined();
    });

    test('serialize includes _bypassed:true when bypassed', () => {
        const m = new GainModule();
        m.init(new AudioContext());
        m.setBypass(true);
        const data = m.serialize();
        expect(data._bypassed).toBe(true);
    });

    test('deserialize restores bypassed=true', () => {
        const m1 = new GainModule();
        m1.init(new AudioContext());
        m1.setBypass(true);
        const data = m1.serialize();
        const m2 = new GainModule();
        m2.init(new AudioContext());
        m2.deserialize(data);
        expect(m2.bypassed).toBe(true);
    });

    test('deserialize without _bypassed leaves bypassed=false', () => {
        const m = new GainModule();
        m.init(new AudioContext());
        m.deserialize({});
        expect(m.bypassed).toBe(false);
    });

    test('bypassed state preserved through full round-trip', () => {
        const m1 = new FilterModule();
        m1.init(new AudioContext());
        m1.params.frequency.value = 2000;
        m1.setBypass(true);
        const data = m1.serialize();
        const m2 = new FilterModule();
        m2.init(new AudioContext());
        m2.deserialize(data);
        expect(m2.bypassed).toBe(true);
        expect(m2.params.frequency.value).toBe(2000);
    });
});
