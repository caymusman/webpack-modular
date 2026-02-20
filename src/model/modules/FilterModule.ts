import { NumericParam, EnumParam, Param } from '../Param';
import { SynthModule } from '../SynthModule';
import { createFilterNode } from '../../audio/nodeFactories';

const FILTER_TYPES = [
    'lowpass',
    'highpass',
    'bandpass',
    'lowshelf',
    'highshelf',
    'peaking',
    'notch',
    'allpass',
] as const;
type FilterType = (typeof FILTER_TYPES)[number];

export class FilterModule extends SynthModule {
    readonly type = 'Filter';
    readonly inputOnly = false;

    readonly params: Record<string, Param<unknown>> & {
        filterType: EnumParam<FilterType>;
        frequency: NumericParam;
        q: NumericParam;
        gain: NumericParam;
    } = {
        filterType: new EnumParam<FilterType>('lowpass', FILTER_TYPES, (node, val) => {
            (node as BiquadFilterNode).type = val;
        }),
        frequency: new NumericParam(350, 0, 20000, (node) => (node as BiquadFilterNode).frequency),
        q: new NumericParam(0, 0, 1000, (node) => (node as BiquadFilterNode).Q),
        gain: new NumericParam(0, -40, 40, (node) => (node as BiquadFilterNode).gain),
    };

    createNode(ctx: AudioContext): AudioNode {
        return createFilterNode(ctx);
    }
}
