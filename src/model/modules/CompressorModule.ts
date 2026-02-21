import { NumericParam, Param } from '../Param';
import { SynthModule } from '../SynthModule';
import { createCompressorNode } from '../../audio/nodeFactories';

export class CompressorModule extends SynthModule {
    readonly type = 'Compressor';
    readonly inputOnly = false;

    readonly params: Record<string, Param<unknown>> & {
        threshold: NumericParam;
        knee: NumericParam;
        ratio: NumericParam;
        attack: NumericParam;
        release: NumericParam;
    } = {
        threshold: new NumericParam(-24, -100, 0, (node) => (node as DynamicsCompressorNode).threshold),
        knee: new NumericParam(30, 0, 40, (node) => (node as DynamicsCompressorNode).knee),
        ratio: new NumericParam(12, 1, 20, (node) => (node as DynamicsCompressorNode).ratio),
        attack: new NumericParam(0.003, 0, 1, (node) => (node as DynamicsCompressorNode).attack),
        release: new NumericParam(0.25, 0, 1, (node) => (node as DynamicsCompressorNode).release),
    };

    createNode(ctx: AudioContext): AudioNode {
        return createCompressorNode(ctx);
    }
}
