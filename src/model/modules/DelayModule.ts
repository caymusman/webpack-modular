import { NumericParam, Param } from '../Param';
import { SynthModule } from '../SynthModule';
import { createDelayNode } from '../../audio/nodeFactories';

export class DelayModule extends SynthModule {
    readonly type = 'Delay';
    readonly inputOnly = false;

    readonly params: Record<string, Param<unknown>> & {
        delayTime: NumericParam;
    } = {
        delayTime: new NumericParam(2.5, 0, 5, (node) => (node as DelayNode).delayTime),
    };

    createNode(ctx: AudioContext): AudioNode {
        return createDelayNode(ctx, 5.0);
    }
}
