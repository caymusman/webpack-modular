import { NumericParam, EnumParam, Param } from '../Param';
import { SynthModule } from '../SynthModule';
import { createOscillatorNode, createGainNode } from '../../audio/nodeFactories';

const WAVE_TYPES = ['sine', 'triangle', 'sawtooth', 'square'] as const;
type WaveType = (typeof WAVE_TYPES)[number];

export class LFOModule extends SynthModule {
    readonly type = 'LFO';
    readonly inputOnly = true;

    private lfoOsc: OscillatorNode | null = null;

    readonly params: Record<string, Param<unknown>> & {
        rate: NumericParam;
        depth: NumericParam;
        waveType: EnumParam<WaveType>;
    } = {
        rate: new NumericParam(1, 0.01, 20, (node) => (node as OscillatorNode).frequency),
        depth: new NumericParam(50, 0, 1000, (node) => (node as GainNode).gain),
        waveType: new EnumParam<WaveType>('sine', WAVE_TYPES, (node, val) => {
            (node as OscillatorNode).type = val;
        }),
    };

    createNode(ctx: AudioContext): AudioNode {
        return createGainNode(ctx, this.params.depth.value);
    }

    init(ctx: AudioContext): AudioNode {
        this.ctx = ctx;
        this.node = this.createNode(ctx); // GainNode (depth scaler)

        this.lfoOsc = createOscillatorNode(ctx, this.params.rate.value);
        this.params.waveType.bind(this.lfoOsc, ctx);
        this.params.rate.bind(this.lfoOsc, ctx);
        this.params.depth.bind(this.node, ctx);

        this.lfoOsc.connect(this.node);
        this.lfoOsc.start();

        return this.node;
    }

    dispose(): void {
        if (this.lfoOsc) {
            try { this.lfoOsc.stop(); } catch { /* ignore */ }
            try { this.lfoOsc.disconnect(); } catch { /* ignore */ }
            this.lfoOsc = null;
        }
        super.dispose();
    }
}
