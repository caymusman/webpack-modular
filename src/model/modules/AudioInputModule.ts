import { NumericParam, Param } from '../Param';
import { SynthModule } from '../SynthModule';
import { createGainNode } from '../../audio/nodeFactories';

export class AudioInputModule extends SynthModule {
    readonly type = 'AudioInput';
    readonly inputOnly = true;

    readonly params: Record<string, Param<unknown>> & {
        gain: NumericParam;
    } = {
        gain: new NumericParam(0.5, 0, 1, (node) => (node as GainNode).gain),
    };

    createNode(ctx: AudioContext): AudioNode {
        return createGainNode(ctx, this.params.gain.value);
    }
}
