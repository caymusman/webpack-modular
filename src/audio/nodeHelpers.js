export function setParamValue(param, value, currentTime) {
    param.setValueAtTime(value, currentTime);
}

export function setNodeType(node, type) {
    node.type = type;
}

export function setPanValue(node, value) {
    node.pan.value = value;
}

export function setDistortionCurve(node, curve) {
    node.curve = curve;
}

export function setOversample(node, oversample) {
    node.oversample = oversample;
}

export function setConvolverBuffer(node, buffer) {
    node.buffer = buffer;
}

export function makeDistortionCurve(amount) {
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    let x;
    for (let i = 0; i < n_samples; ++i) {
        x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
}
