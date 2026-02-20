import { NumericParam, Param } from '../Param';
import { SynthModule } from '../SynthModule';
import { createPannerNode } from '../../audio/nodeFactories';

export class PannerModule extends SynthModule {
    readonly type = 'Panner';
    readonly inputOnly = false;

    readonly params: Record<string, Param<unknown>> & {
        pan: NumericParam;
    } = {
        pan: new NumericParam(0, -1, 1, (node) => (node as StereoPannerNode).pan),
    };

    createNode(ctx: AudioContext): AudioNode {
        return createPannerNode(ctx);
    }
}
