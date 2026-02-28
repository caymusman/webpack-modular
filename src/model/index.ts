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
import { OutputModule } from './modules/OutputModule';
import { ScopeModule } from './modules/ScopeModule';
import { BitcrusherModule } from './modules/BitcrusherModule';
import { EnvelopeFollowerModule } from './modules/EnvelopeFollowerModule';
import { MIDINoteModule } from './modules/MIDINoteModule';

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
export { OutputModule } from './modules/OutputModule';
export { ScopeModule } from './modules/ScopeModule';
export { BitcrusherModule } from './modules/BitcrusherModule';
export { EnvelopeFollowerModule } from './modules/EnvelopeFollowerModule';
export { MIDINoteModule } from './modules/MIDINoteModule';

export const MODULE_LIST: ReadonlyArray<{ type: string; inputOnly: boolean; label: string }> = [
    { type: 'Oscillator',        inputOnly: true,  label: 'Oscillator' },
    { type: 'Gain',              inputOnly: false, label: 'Gain' },
    { type: 'Filter',            inputOnly: false, label: 'Filter' },
    { type: 'Panner',            inputOnly: false, label: 'Panner' },
    { type: 'ADSR',              inputOnly: false, label: 'ADSR' },
    { type: 'Delay',             inputOnly: false, label: 'Delay' },
    { type: 'Distortion',        inputOnly: false, label: 'Distortion' },
    { type: 'Reverb',            inputOnly: false, label: 'Reverb' },
    { type: 'AudioInput',        inputOnly: true,  label: 'Audio Input' },
    { type: 'Recorder',          inputOnly: false, label: 'Recorder' },
    { type: 'Compressor',        inputOnly: false, label: 'Compressor' },
    { type: 'Noise',             inputOnly: true,  label: 'Noise' },
    { type: 'LFO',               inputOnly: true,  label: 'LFO' },
    { type: 'Sequencer',         inputOnly: true,  label: 'Sequencer' },
    { type: 'Output',            inputOnly: false, label: 'Output' },
    { type: 'Scope',             inputOnly: false, label: 'Scope' },
    { type: 'Bitcrusher',        inputOnly: false, label: 'Bitcrusher' },
    { type: 'EnvelopeFollower',  inputOnly: false, label: 'Envelope Follower' },
    { type: 'MIDINote',          inputOnly: true,  label: 'MIDI Note' },
];

export const MODULE_GROUPS: ReadonlyArray<{ label: string; types: string[] }> = [
    { label: 'Sources',    types: ['Oscillator', 'Noise', 'LFO', 'Sequencer', 'MIDINote', 'AudioInput'] },
    { label: 'Effects',    types: ['Gain', 'Filter', 'Panner', 'Delay', 'Distortion', 'Reverb', 'Compressor', 'Bitcrusher'] },
    { label: 'Modulators', types: ['ADSR', 'EnvelopeFollower'] },
    { label: 'Utilities',  types: ['Scope', 'Recorder', 'Output'] },
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
    Output: () => new OutputModule(),
    Scope: () => new ScopeModule(),
    Bitcrusher: () => new BitcrusherModule(),
    EnvelopeFollower: () => new EnvelopeFollowerModule(),
    MIDINote: () => new MIDINoteModule(),
};

export function createModule(type: string): SynthModule {
    const ctor = MODULE_CONSTRUCTORS[type];
    if (!ctor) throw new Error(`Unknown module type: ${type}`);
    return ctor();
}
