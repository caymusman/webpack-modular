import { NumericParam, Param } from '../Param';
import { SynthModule } from '../SynthModule';
import { createGainNode } from '../../audio/nodeFactories';

export class EnvelopeFollowerModule extends SynthModule {
    readonly type = 'EnvelopeFollower';
    readonly inputOnly = false;

    readonly params: Record<string, Param<unknown>> & {
        attack: NumericParam;
        release: NumericParam;
    } = {
        attack: new NumericParam(10, 1, 500),
        release: new NumericParam(100, 10, 2000),
    };

    private _analyser: AnalyserNode | null = null;
    private _source: ConstantSourceNode | null = null;

    createNode(ctx: AudioContext): AudioNode {
        const input = createGainNode(ctx, 1);
        this._analyser = ctx.createAnalyser();
        this._analyser.fftSize = 256;
        input.connect(this._analyser);
        this._source = ctx.createConstantSource();
        this._source.offset.value = 0;
        this._source.start();
        return input;
    }

    getOutputNode(): AudioNode {
        return this._source!;
    }

    getAnalyser(): AnalyserNode {
        return this._analyser!;
    }

    setBypass(bypassed: boolean): void {
        super.setBypass(bypassed);
        // Mute the CV output when bypassed
        if (bypassed && this._source) this._source.offset.value = 0;
    }

    setEnvelope(v: number): void {
        if (!this.bypassed && this._source) this._source.offset.value = v;
    }

    dispose(): void {
        try { this._source?.stop(); } catch { /* already stopped */ }
        try { this._analyser?.disconnect(); } catch { /* ignore */ }
        this._source = null;
        this._analyser = null;
        super.dispose();
    }
}
