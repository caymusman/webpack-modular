import { SynthModule } from './SynthModule';
import { GainModule } from './modules/GainModule';
import { OscillatorModule } from './modules/OscillatorModule';
import { FilterModule } from './modules/FilterModule';
import { PannerModule } from './modules/PannerModule';
import { ADSRModule } from './modules/ADSRModule';
import { DelayModule } from './modules/DelayModule';
import { DistortionModule } from './modules/DistortionModule';
import { ReverbModule } from './modules/ReverbModule';
import { AudioInputModule } from './modules/AudioInputModule';
import { RecorderModule } from './modules/RecorderModule';
import { CompressorModule } from './modules/CompressorModule';
import { NoiseModule } from './modules/NoiseModule';
import { LFOModule } from './modules/LFOModule';
import { SequencerModule } from './modules/SequencerModule';

export { SynthModule } from './SynthModule';
export { Param, NumericParam, EnumParam, BoolParam } from './Param';
export { GainModule } from './modules/GainModule';
export { OscillatorModule } from './modules/OscillatorModule';
export { FilterModule } from './modules/FilterModule';
export { PannerModule } from './modules/PannerModule';
export { ADSRModule } from './modules/ADSRModule';
export { DelayModule } from './modules/DelayModule';
export { DistortionModule } from './modules/DistortionModule';
export { ReverbModule } from './modules/ReverbModule';
export { AudioInputModule } from './modules/AudioInputModule';
export { RecorderModule } from './modules/RecorderModule';
export { CompressorModule } from './modules/CompressorModule';
export { NoiseModule } from './modules/NoiseModule';
export { LFOModule } from './modules/LFOModule';
export { SequencerModule } from './modules/SequencerModule';

export const MODULE_LIST: ReadonlyArray<{ type: string; inputOnly: boolean }> = [
    { type: 'Oscillator', inputOnly: true },
    { type: 'Gain', inputOnly: false },
    { type: 'Filter', inputOnly: false },
    { type: 'Panner', inputOnly: false },
    { type: 'ADSR', inputOnly: false },
    { type: 'Delay', inputOnly: false },
    { type: 'Distortion', inputOnly: false },
    { type: 'Reverb', inputOnly: false },
    { type: 'AudioInput', inputOnly: true },
    { type: 'Recorder', inputOnly: false },
    { type: 'Compressor', inputOnly: false },
    { type: 'Noise', inputOnly: true },
    { type: 'LFO', inputOnly: true },
    { type: 'Sequencer', inputOnly: true },
];

const MODULE_CONSTRUCTORS: Record<string, () => SynthModule> = {
    Gain: () => new GainModule(),
    Oscillator: () => new OscillatorModule(),
    Filter: () => new FilterModule(),
    Panner: () => new PannerModule(),
    ADSR: () => new ADSRModule(),
    Delay: () => new DelayModule(),
    Distortion: () => new DistortionModule(),
    Reverb: () => new ReverbModule(),
    AudioInput: () => new AudioInputModule(),
    Recorder: () => new RecorderModule(),
    Compressor: () => new CompressorModule(),
    Noise: () => new NoiseModule(),
    LFO: () => new LFOModule(),
    Sequencer: () => new SequencerModule(),
};

export function createModule(type: string): SynthModule {
    const ctor = MODULE_CONSTRUCTORS[type];
    if (!ctor) throw new Error(`Unknown module type: ${type}`);
    return ctor();
}
