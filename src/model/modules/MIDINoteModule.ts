import { Param } from '../Param';
import { SynthModule } from '../SynthModule';

export class MIDINoteModule extends SynthModule {
    readonly type = 'MIDINote';
    readonly inputOnly = true; // source only — no receive dock

    readonly params: Record<string, Param<unknown>> = {};

    createNode(ctx: AudioContext): AudioNode {
        const s = ctx.createConstantSource();
        s.offset.value = 440;
        s.start();
        return s;
    }

    setFrequency(hz: number): void {
        (this.node as ConstantSourceNode).offset.value = hz;
    }

    dispose(): void {
        try { (this.node as ConstantSourceNode).stop(); } catch { /* already stopped */ }
        super.dispose();
    }
}
