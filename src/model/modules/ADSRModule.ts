import { NumericParam, Param } from '../Param';
import { SynthModule } from '../SynthModule';
import { createGainNode } from '../../audio/nodeFactories';

export class ADSRModule extends SynthModule {
    readonly type = 'ADSR';
    readonly inputOnly = false;

    readonly params: Record<string, Param<unknown>> & {
        attack: NumericParam;
        decay: NumericParam;
        sustain: NumericParam;
        release: NumericParam;
    } = {
        attack: new NumericParam(0.2, 0, 5),
        decay: new NumericParam(0.2, 0, 5),
        sustain: new NumericParam(0.6, 0, 1),
        release: new NumericParam(0.3, 0, 5),
    };

    createNode(ctx: AudioContext): AudioNode {
        return createGainNode(ctx, 0);
    }
}
