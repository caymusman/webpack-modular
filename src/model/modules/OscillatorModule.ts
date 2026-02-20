import { NumericParam, EnumParam, BoolParam, Param } from '../Param';
import { SynthModule } from '../SynthModule';
import { createOscillatorNode, createGainNode } from '../../audio/nodeFactories';

const WAVE_TYPES = ['sine', 'sawtooth', 'triangle'] as const;
type WaveType = (typeof WAVE_TYPES)[number];

export class OscillatorModule extends SynthModule {
    readonly type = 'Oscillator';
    readonly inputOnly = true;

    private modulatorGain: GainNode | null = null;

    readonly params: Record<string, Param<unknown>> & {
        waveType: EnumParam<WaveType>;
        frequency: NumericParam;
        lfo: BoolParam;
        modDepth: NumericParam;
    } = {
        waveType: new EnumParam<WaveType>('sine', WAVE_TYPES, (node, val) => {
            (node as OscillatorNode).type = val;
        }),
        frequency: new NumericParam(440, 0, 20000, (node) => (node as OscillatorNode).frequency),
        lfo: new BoolParam(false),
        modDepth: new NumericParam(0, 0, 300, (node) => (node as GainNode).gain),
    };

    createNode(ctx: AudioContext): AudioNode {
        return createOscillatorNode(ctx, this.params.frequency.value);
    }

    init(ctx: AudioContext): AudioNode {
        this.ctx = ctx;
        this.node = this.createNode(ctx);
        this.modulatorGain = createGainNode(ctx, this.params.modDepth.value);

        // Bind params
        this.params.waveType.bind(this.node, ctx);
        this.params.frequency.bind(this.node, ctx);
        this.params.lfo.bind(this.node, ctx);
        // modDepth binds to modulatorGain, not the oscillator
        this.params.modDepth.bind(this.modulatorGain, ctx);

        // Connect modulator gain to oscillator frequency
        this.modulatorGain.connect((this.node as OscillatorNode).frequency);
        (this.node as OscillatorNode).start();

        return this.node;
    }

    getParamNode(): AudioNode {
        if (!this.modulatorGain) throw new Error('Oscillator not initialized');
        return this.modulatorGain;
    }

    dispose(): void {
        if (this.node) {
            try {
                (this.node as OscillatorNode).stop();
            } catch {
                // may already be stopped
            }
        }
        if (this.modulatorGain) {
            try {
                this.modulatorGain.disconnect();
            } catch {
                // ignore
            }
            this.modulatorGain = null;
        }
        super.dispose();
    }
}
