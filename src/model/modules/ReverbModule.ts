import { EnumParam, Param } from '../Param';
import { SynthModule } from '../SynthModule';
import { createConvolverNode } from '../../audio/nodeFactories';

const IMPULSE_OPTIONS = ['Small', 'Medium', 'Large'] as const;
type ImpulseType = (typeof IMPULSE_OPTIONS)[number];

export class ReverbModule extends SynthModule {
    readonly type = 'Reverb';
    readonly inputOnly = false;

    readonly params: Record<string, Param<unknown>> & {
        impulse: EnumParam<ImpulseType>;
    } = {
        // No auto-apply — buffer loading is async, handled in component
        impulse: new EnumParam<ImpulseType>('Small', IMPULSE_OPTIONS),
    };

    createNode(ctx: AudioContext): AudioNode {
        return createConvolverNode(ctx);
    }
}
