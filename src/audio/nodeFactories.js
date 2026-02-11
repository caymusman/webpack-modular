export function createOscillatorNode(ctx, frequency = 440) {
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    return osc;
}

export function createGainNode(ctx, initialGain = 1.0) {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(initialGain, ctx.currentTime);
    return gain;
}

export function createFilterNode(ctx) {
    return ctx.createBiquadFilter();
}

export function createPannerNode(ctx) {
    return ctx.createStereoPanner();
}

export function createDelayNode(ctx, maxDelay = 5.0) {
    return ctx.createDelay(maxDelay);
}

export function createWaveShaperNode(ctx) {
    return ctx.createWaveShaper();
}

export function createConvolverNode(ctx) {
    return ctx.createConvolver();
}

export function createMediaStreamDestination(ctx) {
    return ctx.createMediaStreamDestination();
}
