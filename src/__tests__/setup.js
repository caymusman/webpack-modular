// Mock AudioContext and all WebAudio API nodes
// This runs in setupFiles (before test framework)

const mockAudioParam = () => ({
    value: 0,
    setValueAtTime: jest.fn(),
    setTargetAtTime: jest.fn(),
    cancelScheduledValues: jest.fn(),
});

const mockAudioNode = () => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
});

const mockGainNode = () => ({
    ...mockAudioNode(),
    gain: mockAudioParam(),
});

const mockOscillatorNode = () => ({
    ...mockAudioNode(),
    frequency: mockAudioParam(),
    type: 'sine',
    start: jest.fn(),
    stop: jest.fn(),
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

class MockAudioContext {
    constructor() {
        this.currentTime = 0;
        this.destination = mockAudioNode();
    }
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
    decodeAudioData() {
        return Promise.resolve({});
    }
}

global.AudioContext = MockAudioContext;

// Mock MediaRecorder
global.MediaRecorder = class MockMediaRecorder {
    constructor() {
        this.state = 'inactive';
        this.ondataavailable = null;
        this.audioChannels = 1;
    }
    start() {
        this.state = 'recording';
    }
    stop() {
        this.state = 'inactive';
    }
};

// Mock fetch for reverb impulse responses
global.fetch = jest.fn(() =>
    Promise.resolve({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    })
);
