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
    } = {
        bpm: new NumericParam(120, 30, 300),
        waveType: new EnumParam<WaveType>('sine', WAVE_TYPES, (node, val) => {
            (node as OscillatorNode).type = val;
        }),
    };

    get isRunning() { return this._isRunning; }
    get currentStep() { return this._currentStep; }

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

        const stepDurationMs = (60 / this.params.bpm.value) * 1000;
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
        super.dispose();
    }
}
