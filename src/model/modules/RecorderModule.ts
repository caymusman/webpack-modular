import { Param } from '../Param';
import { SynthModule } from '../SynthModule';
import { createGainNode } from '../../audio/nodeFactories';

export class RecorderModule extends SynthModule {
    readonly type = 'Recorder';
    readonly inputOnly = false;

    readonly params: Record<string, Param<unknown>> = {};

    createNode(ctx: AudioContext): AudioNode {
        return createGainNode(ctx, 0);
    }
}
