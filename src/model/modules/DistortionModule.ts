import { NumericParam, EnumParam, Param } from '../Param';
import { SynthModule } from '../SynthModule';
import { createWaveShaperNode } from '../../audio/nodeFactories';
import { makeDistortionCurve } from '../../audio/nodeHelpers';

const OVERSAMPLE_OPTIONS = ['none', '2x', '4x'] as const;
type OversampleType = (typeof OVERSAMPLE_OPTIONS)[number];

export class DistortionModule extends SynthModule {
    readonly type = 'Distortion';
    readonly inputOnly = false;

    readonly params: Record<string, Param<unknown>> & {
        curve: NumericParam;
        oversample: EnumParam<OversampleType>;
    } = {
        curve: new NumericParam(425, 50, 800, undefined, (node, val) => {
            (node as WaveShaperNode).curve = makeDistortionCurve(val);
        }),
        oversample: new EnumParam<OversampleType>('none', OVERSAMPLE_OPTIONS, (node, val) => {
            (node as WaveShaperNode).oversample = val as OverSampleType;
        }),
    };

    createNode(ctx: AudioContext): AudioNode {
        return createWaveShaperNode(ctx);
    }
}
