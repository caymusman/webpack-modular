import {
    createOscillatorNode,
    createGainNode,
    createFilterNode,
    createPannerNode,
    createDelayNode,
    createWaveShaperNode,
    createConvolverNode,
    createMediaStreamDestination,
} from '../audio/nodeFactories';

// Use the MockAudioContext from setup.js (loaded via setupFiles)
describe('nodeFactories', () => {
    let ctx;

    beforeEach(() => {
        ctx = new AudioContext();
    });

    test('createOscillatorNode creates oscillator with default frequency', () => {
        const osc = createOscillatorNode(ctx);
        expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(440, ctx.currentTime);
        expect(osc.start).toBeDefined();
    });

    test('createOscillatorNode accepts custom frequency', () => {
        const osc = createOscillatorNode(ctx, 880);
        expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(880, ctx.currentTime);
    });

    test('createGainNode creates gain with default value 1.0', () => {
        const gain = createGainNode(ctx);
        expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(1.0, ctx.currentTime);
    });

    test('createGainNode accepts custom initial gain', () => {
        const gain = createGainNode(ctx, 0.5);
        expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.5, ctx.currentTime);
    });

    test('createGainNode with zero gain', () => {
        const gain = createGainNode(ctx, 0);
        expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0, ctx.currentTime);
    });

    test('createFilterNode returns a BiquadFilterNode', () => {
        const filter = createFilterNode(ctx);
        expect(filter.frequency).toBeDefined();
        expect(filter.Q).toBeDefined();
        expect(filter.type).toBe('lowpass');
    });

    test('createPannerNode returns a StereoPannerNode', () => {
        const panner = createPannerNode(ctx);
        expect(panner.pan).toBeDefined();
    });

    test('createDelayNode returns a DelayNode', () => {
        const delay = createDelayNode(ctx);
        expect(delay.delayTime).toBeDefined();
    });

    test('createWaveShaperNode returns a WaveShaperNode', () => {
        const ws = createWaveShaperNode(ctx);
        expect(ws).toHaveProperty('curve');
        expect(ws).toHaveProperty('oversample');
    });

    test('createConvolverNode returns a ConvolverNode', () => {
        const conv = createConvolverNode(ctx);
        expect(conv).toHaveProperty('buffer');
    });

    test('createMediaStreamDestination returns a destination node', () => {
        const dest = createMediaStreamDestination(ctx);
        expect(dest.stream).toBeDefined();
    });
});
