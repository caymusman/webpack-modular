import { Param } from '../Param';
import { SynthModule } from '../SynthModule';

export class ScopeModule extends SynthModule {
    readonly type = 'Scope';
    readonly inputOnly = false;

    readonly params: Record<string, Param<unknown>> = {};

    createNode(ctx: AudioContext): AudioNode {
        const a = ctx.createAnalyser();
        a.fftSize = 1024;
        return a;
    }

    getAnalyser(): AnalyserNode {
        return this.getNode() as AnalyserNode;
    }
}
