// Mock AudioContext and all WebAudio API nodes
// This runs in setupFiles (before test framework)

import { vi } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any */

const mockAudioParam = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
});

const mockAudioNode = () => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
});

const mockGainNode = () => ({
    ...mockAudioNode(),
    gain: mockAudioParam(),
});

const mockOscillatorNode = () => ({
    ...mockAudioNode(),
    frequency: mockAudioParam(),
    type: 'sine',
    start: vi.fn(),
    stop: vi.fn(),
});

const mockBiquadFilterNode = () => ({
    ...mockAudioNode(),
    frequency: mockAudioParam(),
    Q: mockAudioParam(),
    gain: mockAudioParam(),
    type: 'lowpass',
});

const mockDelayNode = () => ({
    ...mockAudioNode(),
    delayTime: mockAudioParam(),
});

const mockStereoPannerNode = () => ({
    ...mockAudioNode(),
    pan: mockAudioParam(),
});

const mockWaveShaperNode = () => ({
    ...mockAudioNode(),
    curve: null,
    oversample: 'none',
});

const mockConvolverNode = () => ({
    ...mockAudioNode(),
    buffer: null,
});

const mockMediaStreamDestination = () => ({
    ...mockAudioNode(),
    stream: { getTracks: () => [] },
});

const mockDynamicsCompressorNode = () => ({
    ...mockAudioNode(),
    threshold: mockAudioParam(),
    knee: mockAudioParam(),
    ratio: mockAudioParam(),
    attack: mockAudioParam(),
    release: mockAudioParam(),
    reduction: 0,
});

const mockBufferSourceNode = () => ({
    ...mockAudioNode(),
    buffer: null,
    loop: false,
    start: vi.fn(),
    stop: vi.fn(),
});

class MockAudioContext {
    currentTime = 0;
    sampleRate = 44100;
    destination = mockAudioNode();

    createGain() {
        return mockGainNode();
    }
    createOscillator() {
        return mockOscillatorNode();
    }
    createBiquadFilter() {
        return mockBiquadFilterNode();
    }
    createDelay() {
        return mockDelayNode();
    }
    createStereoPanner() {
        return mockStereoPannerNode();
    }
    createWaveShaper() {
        return mockWaveShaperNode();
    }
    createConvolver() {
        return mockConvolverNode();
    }
    createMediaStreamSource() {
        return mockAudioNode();
    }
    createMediaStreamDestination() {
        return mockMediaStreamDestination();
    }
    createDynamicsCompressor() {
        return mockDynamicsCompressorNode();
    }
    createBuffer(_channels: number, length: number, _sampleRate: number) {
        return {
            length,
            numberOfChannels: _channels,
            sampleRate: _sampleRate,
            duration: length / _sampleRate,
            getChannelData: () => new Float32Array(length),
        };
    }
    createBufferSource() {
        return mockBufferSourceNode();
    }
    createConstantSource() {
        return {
            ...mockAudioNode(),
            offset: mockAudioParam(),
            start: vi.fn(),
            stop: vi.fn(),
        };
    }
    decodeAudioData() {
        return Promise.resolve({});
    }
}

(global as any).AudioContext = MockAudioContext;

// Mock MediaRecorder
(global as any).MediaRecorder = class MockMediaRecorder {
    state = 'inactive';
    ondataavailable: any = null;
    audioChannels = 1;

    start() {
        this.state = 'recording';
    }
    stop() {
        this.state = 'inactive';
    }
};

// Mock fetch for reverb impulse responses
(global as any).fetch = vi.fn(() =>
    Promise.resolve({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    })
);
