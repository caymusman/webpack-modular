import { NumericParam, Param } from '../Param';
import { SynthModule } from '../SynthModule';
import { createGainNode } from '../../audio/nodeFactories';

export class ADSRModule extends SynthModule {
    readonly type = 'ADSR';
    readonly inputOnly = false;

    readonly params: Record<string, Param<unknown>> & {
        attack: NumericParam;
        decay: NumericParam;
        sustain: NumericParam;
        release: NumericParam;
    } = {
        attack: new NumericParam(0.2, 0, 5),
        decay: new NumericParam(0.2, 0, 5),
        sustain: new NumericParam(0.6, 0, 1),
        release: new NumericParam(0.3, 0, 5),
    };

    createNode(ctx: AudioContext): AudioNode {
        return createGainNode(ctx, 0);
    }

    triggerAttack(): void {
        if (!this.ctx || !this.node) return;
        const node = this.node as GainNode;
        const current = this.ctx.currentTime;
        const attack = this.params.attack.value as number;
        const decay = this.params.decay.value as number;
        const sustain = this.params.sustain.value as number;
        node.gain.cancelScheduledValues(current);
        node.gain.setTargetAtTime(0.9, current + attack, attack);
        node.gain.setTargetAtTime(sustain, current + attack + decay, decay);
    }

    triggerRelease(): void {
        if (!this.ctx || !this.node) return;
        const node = this.node as GainNode;
        const current = this.ctx.currentTime;
        const release = this.params.release.value as number;
        node.gain.setTargetAtTime(0.001, current + release, release);
    }
}
