import { Param } from './Param';

export abstract class SynthModule {
    abstract readonly type: string;
    abstract readonly inputOnly: boolean;
    abstract readonly params: Record<string, Param<unknown>>;

    protected node: AudioNode | null = null;
    protected ctx: AudioContext | null = null;

    abstract createNode(ctx: AudioContext): AudioNode;

    getParamNode(): AudioNode | AudioParam | undefined {
        return undefined;
    }

    init(ctx: AudioContext): AudioNode {
        this.ctx = ctx;
        this.node = this.createNode(ctx);
        this.bindParams();
        return this.node;
    }

    bindParams(): void {
        if (!this.node || !this.ctx) return;
        for (const param of Object.values(this.params)) {
            param.bind(this.node, this.ctx);
        }
    }

    dispose(): void {
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
        return data;
    }

    deserialize(data: Record<string, unknown>): void {
        for (const [key, param] of Object.entries(this.params)) {
            if (key in data) {
                param.deserialize(data[key]);
            }
        }
    }
}
