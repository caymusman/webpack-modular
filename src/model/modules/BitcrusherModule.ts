import { NumericParam, Param } from '../Param';
import { SynthModule } from '../SynthModule';
import { createWaveShaperNode } from '../../audio/nodeFactories';
import { makeQuantizationCurve } from '../../audio/nodeHelpers';

export class BitcrusherModule extends SynthModule {
    readonly type = 'Bitcrusher';
    readonly inputOnly = false;

    readonly params: Record<string, Param<unknown>> & {
        bits: NumericParam;
    } = {
        bits: new NumericParam(8, 1, 16, undefined, (node, val) => {
            (node as WaveShaperNode).curve = makeQuantizationCurve(val as number);
        }),
    };

    createNode(ctx: AudioContext): AudioNode {
        const node = createWaveShaperNode(ctx);
        node.curve = makeQuantizationCurve(this.params.bits.value);
        return node;
    }
}
