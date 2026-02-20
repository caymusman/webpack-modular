type Listener = () => void;

export abstract class Param<T> {
    protected _value: T;
    readonly defaultValue: T;
    private listeners = new Set<Listener>();

    constructor(defaultValue: T) {
        this._value = defaultValue;
        this.defaultValue = defaultValue;
    }

    get value(): T {
        return this._value;
    }

    set value(v: T) {
        const validated = this.validate(v);
        if (validated === this._value) return;
        this._value = validated;
        this.onValueChange(validated);
        this.notify();
    }

    subscribe(cb: Listener): () => void {
        this.listeners.add(cb);
        return () => {
            this.listeners.delete(cb);
        };
    }

    reset(): void {
        this.value = this.defaultValue;
    }

    serialize(): unknown {
        return this._value;
    }

    deserialize(raw: unknown): void {
        this.value = raw as T;
    }

    protected notify(): void {
        this.listeners.forEach((cb) => cb());
    }

    protected abstract validate(v: T): T;
    protected abstract onValueChange(v: T): void;

    abstract bind(node: AudioNode, ctx: AudioContext): void;
}

export class NumericParam extends Param<number> {
    readonly min: number;
    readonly max: number;
    private accessor?: (node: AudioNode) => AudioParam;
    private applyFn?: (node: AudioNode, value: number) => void;
    private boundCtx: AudioContext | null = null;
    private boundParam: AudioParam | null = null;
    private boundNode: AudioNode | null = null;

    constructor(
        defaultValue: number,
        min: number,
        max: number,
        accessor?: (node: AudioNode) => AudioParam,
        applyFn?: (node: AudioNode, value: number) => void
    ) {
        super(defaultValue);
        this.min = min;
        this.max = max;
        this.accessor = accessor;
        this.applyFn = applyFn;
    }

    protected validate(v: number): number {
        if (isNaN(v)) return this._value;
        return Math.max(this.min, Math.min(this.max, v));
    }

    protected onValueChange(v: number): void {
        if (this.boundParam && this.boundCtx) {
            this.boundParam.setValueAtTime(v, this.boundCtx.currentTime);
        }
        if (this.applyFn && this.boundNode) {
            this.applyFn(this.boundNode, v);
        }
    }

    bind(node: AudioNode, ctx: AudioContext): void {
        this.boundCtx = ctx;
        this.boundNode = node;
        if (this.accessor) {
            this.boundParam = this.accessor(node);
            this.boundParam.setValueAtTime(this._value, ctx.currentTime);
        }
        if (this.applyFn && this._value !== this.defaultValue) {
            this.applyFn(node, this._value);
        }
    }
}

export class EnumParam<E extends string = string> extends Param<E> {
    readonly options: readonly E[];
    private applyFn?: (node: AudioNode, value: E) => void;
    private boundNode: AudioNode | null = null;

    constructor(defaultValue: E, options: readonly E[], applyFn?: (node: AudioNode, value: E) => void) {
        super(defaultValue);
        this.options = options;
        this.applyFn = applyFn;
    }

    protected validate(v: E): E {
        return this.options.includes(v) ? v : this._value;
    }

    protected onValueChange(v: E): void {
        if (this.applyFn && this.boundNode) {
            this.applyFn(this.boundNode, v);
        }
    }

    bind(node: AudioNode, ctx: AudioContext): void {
        void ctx;
        this.boundNode = node;
        if (this.applyFn && this._value !== this.defaultValue) {
            this.applyFn(node, this._value);
        }
    }
}

export class BoolParam extends Param<boolean> {
    protected validate(v: boolean): boolean {
        return !!v;
    }

    protected onValueChange(): void {
        // No audio binding for booleans
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    bind(_node: AudioNode, _ctx: AudioContext): void {
        // No audio binding for booleans
    }
}
