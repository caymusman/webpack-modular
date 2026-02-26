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

    private _analyser: AnalyserNode | null = null;

    createNode(ctx: AudioContext): AudioNode {
        const gain = createGainNode(ctx, this.params.volume.value);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        gain.connect(analyser);
        analyser.connect(ctx.destination);
        this._analyser = analyser;
        return gain;
    }

    getAnalyser(): AnalyserNode {
        return this._analyser!;
    }

    dispose(): void {
        try { this._analyser?.disconnect(); } catch { /* ignore */ }
        this._analyser = null;
        super.dispose();
    }
}
