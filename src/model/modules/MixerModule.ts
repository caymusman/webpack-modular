import { NumericParam, Param } from '../Param';
import { SynthModule } from '../SynthModule';
import { createGainNode } from '../../audio/nodeFactories';

export class MixerModule extends SynthModule {
    readonly type = 'Mixer';
    readonly inputOnly = false;

    readonly params: Record<string, Param<unknown>> & {
        level: NumericParam;
    } = {
        level: new NumericParam(1, 0, 2, (node) => (node as GainNode).gain),
    };

    createNode(ctx: AudioContext): AudioNode {
        return createGainNode(ctx, this.params.level.value);
    }

    getParamNode(): AudioParam {
        return (this.getNode() as GainNode).gain;
    }
}
