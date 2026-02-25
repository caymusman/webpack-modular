import { NumericParam, Param } from '../Param';
import { SynthModule } from '../SynthModule';
import { createGainNode } from '../../audio/nodeFactories';

export class OutputModule extends SynthModule {
    readonly type = 'Output';
    readonly inputOnly = false; // input dock visible — things connect TO this module
    readonly sinkOnly = true;   // output dock hidden — nothing connects FROM this module

    readonly params: Record<string, Param<unknown>> & {
        volume: NumericParam;
    } = {
        volume: new NumericParam(0.5, 0, 1, (node) => (node as GainNode).gain),
    };

    createNode(ctx: AudioContext): AudioNode {
        const node = createGainNode(ctx, this.params.volume.value);
        node.connect(ctx.destination);
        return node;
    }
}
