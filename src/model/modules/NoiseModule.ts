import { NumericParam, EnumParam, Param } from '../Param';
import { SynthModule } from '../SynthModule';
import { createGainNode } from '../../audio/nodeFactories';

const NOISE_TYPES = ['white', 'pink', 'brown'] as const;
type NoiseType = (typeof NOISE_TYPES)[number];

function buildNoiseBuffer(ctx: AudioContext, type: NoiseType): AudioBufferSourceNode {
    const bufferSize = ctx.sampleRate; // 1 second, loops seamlessly
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    } else if (type === 'pink') {
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const w = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + w * 0.0555179;
            b1 = 0.99332 * b1 + w * 0.0750759;
            b2 = 0.96900 * b2 + w * 0.1538520;
            b3 = 0.86650 * b3 + w * 0.3104856;
            b4 = 0.55000 * b4 + w * 0.5329522;
            b5 = -0.7616 * b5 - w * 0.0168980;
            data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) / 8;
            b6 = w * 0.115926;
        }
    } else {
        // brown
        let last = 0;
        for (let i = 0; i < bufferSize; i++) {
            const w = Math.random() * 2 - 1;
            last = (last + 0.02 * w) / 1.02;
            data[i] = last * 3.5;
        }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.start();
    return source;
}

export class NoiseModule extends SynthModule {
    readonly type = 'Noise';
    readonly inputOnly = true;

    private noiseSource: AudioBufferSourceNode | null = null;

    readonly params: Record<string, Param<unknown>> & {
        noiseType: EnumParam<NoiseType>;
        gain: NumericParam;
    } = {
        noiseType: new EnumParam<NoiseType>('white', NOISE_TYPES),
        gain: new NumericParam(0.7, 0, 1, (node) => (node as GainNode).gain),
    };

    createNode(ctx: AudioContext): AudioNode {
        return createGainNode(ctx, this.params.gain.value);
    }

    init(ctx: AudioContext): AudioNode {
        this.ctx = ctx;
        this.node = this.createNode(ctx);
        this.params.gain.bind(this.node, ctx);

        this.noiseSource = buildNoiseBuffer(ctx, this.params.noiseType.value);
        this.noiseSource.connect(this.node);

        return this.node;
    }

    /** Called from the view when the user picks a different noise colour. */
    switchNoiseType(type: NoiseType): void {
        if (!this.ctx || !this.node) return;
        if (this.noiseSource) {
            try { this.noiseSource.stop(); } catch { /* already stopped */ }
            this.noiseSource.disconnect();
        }
        this.noiseSource = buildNoiseBuffer(this.ctx, type);
        this.noiseSource.connect(this.node);
        this.params.noiseType.value = type;
    }

    dispose(): void {
        if (this.noiseSource) {
            try { this.noiseSource.stop(); } catch { /* ignore */ }
            this.noiseSource = null;
        }
        super.dispose();
    }
}
