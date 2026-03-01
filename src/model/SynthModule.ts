import { Param } from './Param';

export abstract class SynthModule {
    abstract readonly type: string;
    abstract readonly inputOnly: boolean;
    /** When true, Area hides the output (send) dock — module is a signal sink only */
    readonly sinkOnly: boolean = false;
    abstract readonly params: Record<string, Param<unknown>>;

    protected node: AudioNode | null = null;
    protected ctx: AudioContext | null = null;

    // Bypass infrastructure
    /** Effect modules: what incoming patch cords connect TO */
    protected _inputWrapper: GainNode | null = null;
    /** Effect modules: gates the wet/active signal path (gain=1 active, 0 bypassed) */
    protected _wetGain: GainNode | null = null;
    /** Effect modules: what outgoing patch cords connect FROM */
    protected _outputWrapper: GainNode | null = null;
    /** Effect modules: bypass dry path (gain=0 active, 1 bypassed) */
    protected _dryGain: GainNode | null = null;
    /** Source modules: gated output (gain=1 active, 0 bypassed) */
    protected _outputGain: GainNode | null = null;

    /** True when bypass is engaged */
    bypassed = false;

    abstract createNode(ctx: AudioContext): AudioNode;

    getParamNode(): AudioNode | AudioParam | undefined {
        return undefined;
    }

    /** Returns the node that incoming patch cord connections should connect TO. */
    getInputNode(): AudioNode {
        return this._inputWrapper ?? this.getNode();
    }

    getOutputNode(): AudioNode | undefined {
        if (this._outputWrapper) return this._outputWrapper;
        if (this._outputGain) return this._outputGain;
        return undefined;
    }

    init(ctx: AudioContext): AudioNode {
        this.ctx = ctx;
        this.node = this.createNode(ctx);

        if (!this.inputOnly) {
            // Effect / pass-through module: full bypass wrapper
            // Active path:   _inputWrapper → _wetGain → processingNode → _outputWrapper
            // Bypass path:   _inputWrapper → _dryGain  → _outputWrapper
            this._inputWrapper = ctx.createGain();
            this._wetGain = ctx.createGain();
            this._outputWrapper = ctx.createGain();
            this._dryGain = ctx.createGain();
            this._dryGain.gain.value = 0;

            this._inputWrapper.connect(this._wetGain);
            this._wetGain.connect(this.node);
            this.node.connect(this._outputWrapper);
            this._inputWrapper.connect(this._dryGain);
            this._dryGain.connect(this._outputWrapper);
        } else {
            // Source module: add a gated output gain for mute-bypass
            this._outputGain = ctx.createGain();
            this.node.connect(this._outputGain);
        }

        this.bindParams();
        return this.node;
    }

    /**
     * Toggle bypass.
     * Effect modules: wet path closes, dry path opens (signal passes unchanged).
     * Source modules: output is muted.
     */
    setBypass(bypassed: boolean): void {
        this.bypassed = bypassed;
        if (this._wetGain && this._dryGain) {
            this._wetGain.gain.value = bypassed ? 0 : 1;
            this._dryGain.gain.value = bypassed ? 1 : 0;
        }
        if (this._outputGain) {
            this._outputGain.gain.value = bypassed ? 0 : 1;
        }
    }

    bindParams(): void {
        if (!this.node || !this.ctx) return;
        for (const param of Object.values(this.params)) {
            param.bind(this.node, this.ctx);
        }
    }

    dispose(): void {
        if (this._dryGain) {
            try { this._dryGain.disconnect(); } catch { /* ignore */ }
            this._dryGain = null;
        }
        if (this._wetGain) {
            try { this._wetGain.disconnect(); } catch { /* ignore */ }
            this._wetGain = null;
        }
        if (this._inputWrapper) {
            try { this._inputWrapper.disconnect(); } catch { /* ignore */ }
            this._inputWrapper = null;
        }
        if (this._outputWrapper) {
            try { this._outputWrapper.disconnect(); } catch { /* ignore */ }
            this._outputWrapper = null;
        }
        if (this._outputGain) {
            try { this._outputGain.disconnect(); } catch { /* ignore */ }
            this._outputGain = null;
        }
        if (this.node) {
            try {
                this.node.disconnect();
            } catch {
                // ignore
            }
            this.node = null;
        }
    }

    getNode(): AudioNode {
        if (!this.node) throw new Error(`${this.type} module not initialized`);
        return this.node;
    }

    serialize(): Record<string, unknown> {
        const data: Record<string, unknown> = {};
        for (const [key, param] of Object.entries(this.params)) {
            data[key] = param.serialize();
        }
        if (this.bypassed) data._bypassed = true;
        return data;
    }

    deserialize(data: Record<string, unknown>): void {
        for (const [key, param] of Object.entries(this.params)) {
            if (key in data) {
                param.deserialize(data[key]);
            }
        }
        if (data._bypassed === true) this.setBypass(true);
    }
}
