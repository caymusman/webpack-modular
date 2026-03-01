import { NumericParam, BoolParam, Param } from '../Param';
import { SynthModule } from '../SynthModule';
import { createGainNode } from '../../audio/nodeFactories';

export class AudioClipModule extends SynthModule {
    readonly type = 'AudioClip';
    readonly inputOnly = true;

    buffer: AudioBuffer | null = null;
    clipName = '';
    onBufferLoad: (() => void) | null = null;
    onPlaybackEnd: (() => void) | null = null;

    private _sourceNode: AudioBufferSourceNode | null = null;
    private _isPlaying = false;

    readonly params: Record<string, Param<unknown>> & {
        playbackRate: NumericParam;
        loop: BoolParam;
        trimStart: NumericParam;
        trimEnd: NumericParam;
    } = {
        playbackRate: new NumericParam(1, 0.1, 4, undefined, (_node, val) => {
            if (this._sourceNode) {
                this._sourceNode.playbackRate.setValueAtTime(val, this.ctx!.currentTime);
            }
        }),
        loop: new BoolParam(true),
        trimStart: new NumericParam(0, 0, 3600),
        trimEnd: new NumericParam(0, 0, 3600),
    };

    createNode(ctx: AudioContext): AudioNode {
        return createGainNode(ctx, 1);
    }

    override init(ctx: AudioContext): AudioNode {
        this.ctx = ctx;
        this.node = this.createNode(ctx);
        this._outputGain = ctx.createGain();
        (this.node as GainNode).connect(this._outputGain);
        this.bindParams();
        return this.node;
    }

    loadBuffer(buffer: AudioBuffer, name: string): void {
        this.buffer = buffer;
        this.clipName = name;
        // Only reset trim points when they are at defaults (new load, not re-link after preset restore)
        if (this.params.trimEnd.value === 0 || this.params.trimEnd.value > buffer.duration) {
            this.params.trimEnd.value = buffer.duration;
        }
        if (this.params.trimStart.value >= buffer.duration) {
            this.params.trimStart.value = 0;
        }
        this.onBufferLoad?.();
    }

    play(): void {
        if (!this.buffer || !this.ctx || !this.node) return;
        this.stop();
        const src = this.ctx.createBufferSource();
        src.buffer = this.buffer;
        src.loop = this.params.loop.value;
        src.loopStart = this.params.trimStart.value;
        src.loopEnd = this.params.trimEnd.value;
        src.playbackRate.setValueAtTime(this.params.playbackRate.value, this.ctx.currentTime);
        src.connect(this.node as GainNode);
        src.start(0, this.params.trimStart.value);
        this._sourceNode = src;
        this._isPlaying = true;
        src.onended = () => {
            this._isPlaying = false;
            this.onPlaybackEnd?.();
        };
    }

    updatePlaybackRate(val: number): void {
        if (this._sourceNode) {
            this._sourceNode.playbackRate.value = val;
        }
    }

    stop(): void {
        try { this._sourceNode?.stop(); } catch { /* already ended */ }
        this._sourceNode?.disconnect();
        this._sourceNode = null;
        this._isPlaying = false;
    }

    get isPlaying(): boolean {
        return this._isPlaying;
    }

    override serialize(): Record<string, unknown> {
        return { ...super.serialize(), clipName: this.clipName };
    }

    override deserialize(data: Record<string, unknown>): void {
        super.deserialize(data);
        if (typeof data.clipName === 'string') this.clipName = data.clipName;
    }

    clear(): void {
        this.stop();
        this.buffer = null;
        this.clipName = '';
        this.params.trimStart.reset();
        this.params.trimEnd.reset();
    }

    override dispose(): void {
        this.stop();
        super.dispose();
    }
}
