export function setParamValue(param: AudioParam, value: number, currentTime: number): void {
    param.setValueAtTime(value, currentTime);
}

export function setNodeType(node: OscillatorNode | BiquadFilterNode, type: string): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node as any).type = type;
}

export function setPanValue(node: StereoPannerNode, value: number): void {
    node.pan.value = value;
}

export function setDistortionCurve(node: WaveShaperNode, curve: Float32Array<ArrayBuffer>): void {
    node.curve = curve;
}

export function setOversample(node: WaveShaperNode, oversample: OverSampleType): void {
    node.oversample = oversample;
}

export function setConvolverBuffer(node: ConvolverNode, buffer: AudioBuffer): void {
    node.buffer = buffer;
}

export function makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    let x: number;
    for (let i = 0; i < n_samples; ++i) {
        x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
}
