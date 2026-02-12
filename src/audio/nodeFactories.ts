export function createOscillatorNode(ctx: AudioContext, frequency = 440): OscillatorNode {
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    return osc;
}

export function createGainNode(ctx: AudioContext, initialGain = 1.0): GainNode {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(initialGain, ctx.currentTime);
    return gain;
}

export function createFilterNode(ctx: AudioContext): BiquadFilterNode {
    return ctx.createBiquadFilter();
}

export function createPannerNode(ctx: AudioContext): StereoPannerNode {
    return ctx.createStereoPanner();
}

export function createDelayNode(ctx: AudioContext, maxDelay = 5.0): DelayNode {
    return ctx.createDelay(maxDelay);
}

export function createWaveShaperNode(ctx: AudioContext): WaveShaperNode {
    return ctx.createWaveShaper();
}

export function createConvolverNode(ctx: AudioContext): ConvolverNode {
    return ctx.createConvolver();
}

export function createMediaStreamDestination(ctx: AudioContext): MediaStreamAudioDestinationNode {
    return ctx.createMediaStreamDestination();
}
