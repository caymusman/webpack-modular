import { NumericParam, Param } from '../Param';
import { SynthModule } from '../SynthModule';
import { createGainNode } from '../../audio/nodeFactories';

export class SwitchModule extends SynthModule {
    readonly type = 'Switch';
    readonly inputOnly = true;

    channelGains: GainNode[] = [];
    private _mixGain: GainNode | null = null;
    private _cvInput: GainNode | null = null;
    private _cvAnalyser: AnalyserNode | null = null;
    private _pollInterval: ReturnType<typeof setInterval> | null = null;
    private _activeChannel = 0;
    private _lastPollTime = 0;
    private _cycleAccum = 0;

    readonly params: Record<string, Param<unknown>> & {
        channelCount: NumericParam;
        activeChannel: NumericParam;
        rate: NumericParam;
    } = {
        channelCount: new NumericParam(2, 2, 4),
        activeChannel: new NumericParam(0, 0, 3, undefined, (_node, val) => {
            this.setActiveChannel(Math.round(val));
        }),
        rate: new NumericParam(0, 0, 20),
    };

    createNode(ctx: AudioContext): AudioNode {
        return createGainNode(ctx, 1);
    }

    override init(ctx: AudioContext): AudioNode {
        this.ctx = ctx;

        this._mixGain = createGainNode(ctx, 1);

        this.channelGains = [];
        for (let i = 0; i < 4; i++) {
            const g = createGainNode(ctx, i === 0 ? 1 : 0);
            g.connect(this._mixGain);
            this.channelGains.push(g);
        }

        this._cvInput = createGainNode(ctx, 1);
        this._cvAnalyser = ctx.createAnalyser();
        this._cvInput.connect(this._cvAnalyser);

        this.node = this._mixGain;

        this._outputGain = ctx.createGain();
        this._mixGain.connect(this._outputGain);

        this.params.channelCount.bind(this._mixGain, ctx);
        this.params.activeChannel.bind(this._mixGain, ctx);
        this.params.rate.bind(this._mixGain, ctx);

        this._pollInterval = setInterval(() => this._pollCV(), 50);

        return this._mixGain;
    }

    private _pollCV(): void {
        const now = Date.now();
        const dt = this._lastPollTime ? (now - this._lastPollTime) / 1000 : 0;
        this._lastPollTime = now;

        // CV signal takes priority over auto-rate
        if (this._cvAnalyser) {
            const data = new Float32Array(32);
            this._cvAnalyser.getFloatTimeDomainData(data);
            const hasSignal = data.some(v => Math.abs(v) > 0.001);
            if (hasSignal) {
                const count = Math.round(this.params.channelCount.value);
                const ch = Math.round(Math.max(0, Math.min(count - 1, data[0])));
                if (ch !== this._activeChannel) this.setActiveChannel(ch);
                this._cycleAccum = 0;
                return;
            }
        }

        // Auto-rate cycling
        const rate = this.params.rate.value;
        if (rate > 0 && dt > 0) {
            this._cycleAccum += dt * rate;
            if (this._cycleAccum >= 1) {
                this._cycleAccum -= Math.floor(this._cycleAccum);
                const count = Math.round(this.params.channelCount.value);
                const next = (this._activeChannel + 1) % count;
                this.setActiveChannel(next);
            }
        } else if (rate === 0) {
            this._cycleAccum = 0;
        }
    }

    setActiveChannel(channel: number): void {
        const FADE_TIME = 0.02; // 20 ms — imperceptible for typical synth signals
        const count = Math.round(this.params.channelCount.value);
        const ch = Math.max(0, Math.min(count - 1, channel));
        const now = this.ctx?.currentTime;
        this.channelGains.forEach((g, i) => {
            if (this.ctx && now !== undefined) {
                g.gain.cancelScheduledValues(now);
                g.gain.setValueAtTime(g.gain.value, now); // anchor current position
                g.gain.linearRampToValueAtTime(i === ch ? 1 : 0, now + FADE_TIME);
            } else {
                g.gain.value = i === ch ? 1 : 0;
            }
        });
        this._activeChannel = ch;
        if (this.params.activeChannel.value !== ch) {
            this.params.activeChannel.value = ch;
        }
    }

    getChannelGain(i: number): GainNode {
        return this.channelGains[i];
    }

    override getParamNode(): AudioNode | undefined {
        return this._cvInput ?? undefined;
    }

    override dispose(): void {
        if (this._pollInterval) {
            clearInterval(this._pollInterval);
            this._pollInterval = null;
        }
        try { this._cvInput?.disconnect(); } catch { /* ignore */ }
        try { this._cvAnalyser?.disconnect(); } catch { /* ignore */ }
        this.channelGains.forEach(g => {
            try { g.disconnect(); } catch { /* ignore */ }
        });
        this._cvInput = null;
        this._cvAnalyser = null;
        this.channelGains = [];
        super.dispose();
    }
}
