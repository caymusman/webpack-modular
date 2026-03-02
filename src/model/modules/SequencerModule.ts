import { NumericParam, EnumParam, Param } from '../Param';
import { SynthModule } from '../SynthModule';
import { createOscillatorNode, createGainNode } from '../../audio/nodeFactories';

const WAVE_TYPES = ['sine', 'sawtooth', 'triangle', 'square'] as const;
type WaveType = (typeof WAVE_TYPES)[number];

// Default steps: C major scale starting at C4
const DEFAULT_STEPS = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25];

export class SequencerModule extends SynthModule {
    readonly type = 'Sequencer';
    readonly inputOnly = true;

    private seqOsc: OscillatorNode | null = null;
    private timeoutId: ReturnType<typeof setTimeout> | null = null;
    private _isRunning = false;
    private _currentStep = 0;
    private _rateModInput: GainNode | null = null;
    private _rateModAnalyser: AnalyserNode | null = null;
    private _rateModBuffer: Float32Array<ArrayBuffer> | null = null;

    steps: number[] = [...DEFAULT_STEPS];
    activeSteps: boolean[] = Array(8).fill(true);

    setStepCount(count: number): void {
        const n = Math.max(2, Math.min(16, count));
        if (n > this.steps.length) {
            while (this.steps.length < n) {
                this.steps.push(261.63); // C4
                this.activeSteps.push(true);
            }
        } else {
            this.steps = this.steps.slice(0, n);
            this.activeSteps = this.activeSteps.slice(0, n);
        }
        // Keep currentStep in bounds
        if (this._currentStep >= this.steps.length) {
            this._currentStep = 0;
        }
    }

    /** Called on every step advance so the view can highlight the active step. */
    onStep: ((step: number) => void) | null = null;

    readonly params: Record<string, Param<unknown>> & {
        bpm: NumericParam;
        waveType: EnumParam<WaveType>;
        rateCVDepth: NumericParam;
    } = {
        bpm: new NumericParam(120, 30, 600),
        waveType: new EnumParam<WaveType>('sine', WAVE_TYPES, (node, val) => {
            (node as OscillatorNode).type = val;
        }),
        rateCVDepth: new NumericParam(60, 0, 200),
    };

    get isRunning() { return this._isRunning; }
    get currentStep() { return this._currentStep; }

    override getParamNode(): AudioNode | undefined {
        return this._rateModInput ?? undefined;
    }

    createNode(ctx: AudioContext): AudioNode {
        return createGainNode(ctx, 0);
    }

    init(ctx: AudioContext): AudioNode {
        this.ctx = ctx;
        this.node = this.createNode(ctx); // GainNode (output amplitude)

        this.seqOsc = createOscillatorNode(ctx, this.steps[0]);
        this.params.waveType.bind(this.seqOsc, ctx);
        // bpm has no audio binding
        this.params.bpm.bind(this.node, ctx);

        this.seqOsc.connect(this.node);
        this.seqOsc.start();

        // Output gain for bypass (mute)
        this._outputGain = ctx.createGain();
        this.node.connect(this._outputGain);

        // Rate CV input: incoming patch cords land here; we sample via analyser
        this._rateModInput = ctx.createGain();
        this._rateModAnalyser = ctx.createAnalyser();
        this._rateModAnalyser.fftSize = 256;
        this._rateModBuffer = new Float32Array(this._rateModAnalyser.fftSize);
        this._rateModInput.connect(this._rateModAnalyser);
        // Analyser is a dead-end — we only read from it, never connect its output

        return this.node;
    }

    start(): void {
        if (this._isRunning) return;
        this._isRunning = true;
        this._currentStep = 0;
        this.scheduleNext();
    }

    stop(): void {
        this._isRunning = false;
        if (this.timeoutId !== null) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        if (this.node && this.ctx) {
            (this.node as GainNode).gain.setValueAtTime(0, this.ctx.currentTime);
        }
    }

    private scheduleNext(): void {
        if (!this._isRunning || !this.ctx || !this.seqOsc || !this.node) return;

        // Sample CV offset from rate mod input
        let cvOffset = 0;
        if (this._rateModAnalyser && this._rateModBuffer) {
            this._rateModAnalyser.getFloatTimeDomainData(this._rateModBuffer);
            let sum = 0;
            for (let i = 0; i < this._rateModBuffer.length; i++) sum += this._rateModBuffer[i];
            cvOffset = (sum / this._rateModBuffer.length) * this.params.rateCVDepth.value;
        }
        const effectiveBpm = Math.max(1, this.params.bpm.value + cvOffset);
        const stepDurationMs = (60 / effectiveBpm) * 1000;
        const step = this._currentStep;
        const isActive = this.activeSteps[step];

        if (isActive) {
            this.seqOsc.frequency.setValueAtTime(this.steps[step], this.ctx.currentTime);
            (this.node as GainNode).gain.setValueAtTime(0.7, this.ctx.currentTime);
        } else {
            (this.node as GainNode).gain.setValueAtTime(0, this.ctx.currentTime);
        }

        if (this.onStep) this.onStep(step);
        this._currentStep = (step + 1) % this.steps.length;

        this.timeoutId = setTimeout(() => this.scheduleNext(), stepDurationMs);
    }

    serialize(): Record<string, unknown> {
        return {
            ...super.serialize(),
            steps: this.steps,
            activeSteps: this.activeSteps,
        };
    }

    deserialize(data: Record<string, unknown>): void {
        super.deserialize(data);
        if (Array.isArray(data.steps)) this.steps = data.steps as number[];
        if (Array.isArray(data.activeSteps)) this.activeSteps = data.activeSteps as boolean[];
    }

    dispose(): void {
        this.stop();
        if (this.seqOsc) {
            try { this.seqOsc.stop(); } catch { /* ignore */ }
            try { this.seqOsc.disconnect(); } catch { /* ignore */ }
            this.seqOsc = null;
        }
        if (this._rateModAnalyser) {
            try { this._rateModAnalyser.disconnect(); } catch { /* ignore */ }
            this._rateModAnalyser = null;
        }
        if (this._rateModInput) {
            try { this._rateModInput.disconnect(); } catch { /* ignore */ }
            this._rateModInput = null;
        }
        this._rateModBuffer = null;
        super.dispose();
    }
}
