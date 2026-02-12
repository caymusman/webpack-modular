import { fireEvent, screen } from '@testing-library/react';
import App from '../App';
import { renderWithAudioContext } from './testUtils';

// The UI components (Slider, LogSlider, Dial, etc.) are not exported individually,
// so we test them through their parent modules rendered via App.

describe('Slider (via Gain module)', () => {
    let container;

    beforeEach(() => {
        const result = renderWithAudioContext(<App />);
        container = result.container;
        // Create a Gain module which uses a plain Slider
        const gainButton = screen.getByRole('button', { name: 'Gain' });
        fireEvent.click(gainButton);
    });

    test('renders range and numeric inputs', () => {
        const rangeInput = container.querySelector('#gainRangeInput');
        const numInput = container.querySelector('#gainNumInput');
        expect(rangeInput).toBeTruthy();
        expect(numInput).toBeTruthy();
    });

    test('range input defaults to midpoint (0.5)', () => {
        const rangeInput = container.querySelector('#gainRangeInput');
        expect(rangeInput.value).toBe('0.5');
    });

    test('changing range updates numeric display', () => {
        const rangeInput = container.querySelector('#gainRangeInput');
        const numInput = container.querySelector('#gainNumInput');
        fireEvent.change(rangeInput, { target: { value: '0.8' } });
        expect(numInput.value).toBe('0.8');
    });

    test('numeric input rejects non-numeric text', () => {
        const numInput = container.querySelector('#gainNumInput');
        fireEvent.change(numInput, { target: { value: 'abc' } });
        // Should not change from default
        expect(numInput.value).toBe('0.5');
    });

    test('numeric input accepts valid numbers', () => {
        const numInput = container.querySelector('#gainNumInput');
        fireEvent.change(numInput, { target: { value: '0.7' } });
        expect(numInput.value).toBe('0.7');
    });

    test('Enter key submits numeric value', () => {
        const numInput = container.querySelector('#gainNumInput');
        fireEvent.change(numInput, { target: { value: '0.3' } });
        fireEvent.keyDown(numInput, { key: 'Enter', charCode: 13 });
        // After submit, the range input should reflect the numeric value
        const rangeInput = container.querySelector('#gainRangeInput');
        expect(rangeInput.value).toBe('0.3');
    });
});

describe('Slider (via Filter module)', () => {
    let container;

    beforeEach(() => {
        const result = renderWithAudioContext(<App />);
        container = result.container;
        const filterButton = screen.getByRole('button', { name: 'Filter' });
        fireEvent.click(filterButton);
    });

    test('Filter Gain slider renders with correct range', () => {
        const rangeInput = container.querySelector('#filterGainRange');
        expect(rangeInput).toBeTruthy();
        expect(rangeInput.min).toBe('-40');
        expect(rangeInput.max).toBe('40');
    });

    test('Filter Gain slider initializes to midpoint (0)', () => {
        const numInput = container.querySelector('#filterGainNumber');
        expect(numInput.value).toBe('0');
    });
});

describe('Slider (via Delay module)', () => {
    let container;

    beforeEach(() => {
        const result = renderWithAudioContext(<App />);
        container = result.container;
        const delayButton = screen.getByRole('button', { name: 'Delay' });
        fireEvent.click(delayButton);
    });

    test('Delay Time slider has correct range', () => {
        const rangeInput = container.querySelector('#delayDelayTimeRange');
        expect(rangeInput).toBeTruthy();
        expect(rangeInput.min).toBe('0');
        expect(rangeInput.max).toBe('5');
    });

    test('Delay Time slider initializes to midpoint (2.5)', () => {
        const numInput = container.querySelector('#delayDelayTimeNumber');
        expect(numInput.value).toBe('2.5');
    });
});

describe('Slider (via Panner module)', () => {
    let container;

    beforeEach(() => {
        const result = renderWithAudioContext(<App />);
        container = result.container;
        const pannerButton = screen.getByRole('button', { name: 'Panner' });
        fireEvent.click(pannerButton);
    });

    test('Pan slider has correct range', () => {
        const rangeInput = container.querySelector('#panPanRange');
        expect(rangeInput).toBeTruthy();
        expect(rangeInput.min).toBe('-1');
        expect(rangeInput.max).toBe('1');
    });

    test('Pan slider initializes to center (0)', () => {
        const numInput = container.querySelector('#panPanNumber');
        expect(numInput.value).toBe('0');
    });
});

describe('LogSlider (via Oscillator module)', () => {
    let container;

    beforeEach(() => {
        const result = renderWithAudioContext(<App />);
        container = result.container;
        const oscButton = screen.getByRole('button', { name: 'Oscillator' });
        fireEvent.click(oscButton);
    });

    test('renders frequency range and number input', () => {
        const numInput = container.querySelector('#oscFreqfreqNumInput');
        expect(numInput).toBeTruthy();
    });

    test('frequency defaults to 440 Hz', () => {
        const numInput = container.querySelector('#oscFreqfreqNumInput');
        expect(numInput.value).toBe('440');
    });

    test('numeric input rejects non-numeric text', () => {
        const numInput = container.querySelector('#oscFreqfreqNumInput');
        const original = numInput.value;
        fireEvent.change(numInput, { target: { value: 'abc' } });
        expect(numInput.value).toBe(original);
    });

    test('numeric input accepts valid numbers', () => {
        const numInput = container.querySelector('#oscFreqfreqNumInput');
        fireEvent.change(numInput, { target: { value: '880' } });
        expect(numInput.value).toBe('880');
    });
});

describe('Selector (via Oscillator waveform)', () => {
    let container;

    beforeEach(() => {
        const result = renderWithAudioContext(<App />);
        container = result.container;
        const oscButton = screen.getByRole('button', { name: 'Oscillator' });
        fireEvent.click(oscButton);
    });

    test('renders with default value', () => {
        const selector = container.querySelector('#waveSelector');
        expect(selector).toBeTruthy();
        // Default first value should be displayed
        const display = selector.querySelector('span');
        expect(display.textContent).toBe('sine');
    });

    test('shows all options', () => {
        const selector = container.querySelector('#waveSelector');
        const options = selector.querySelectorAll('.selectorVal');
        const values = Array.from(options).map((o) => o.textContent);
        expect(values).toContain('sine');
        expect(values).toContain('sawtooth');
        expect(values).toContain('triangle');
    });

    test('clicking option updates display', () => {
        const selector = container.querySelector('#waveSelector');
        const options = selector.querySelectorAll('.selectorVal');
        // Click "sawtooth"
        const sawOption = Array.from(options).find((o) => o.textContent === 'sawtooth');
        fireEvent.click(sawOption);

        const display = selector.querySelector('span');
        expect(display.textContent).toBe('sawtooth');
    });
});

describe('Selector (via Filter type)', () => {
    let container;

    beforeEach(() => {
        const result = renderWithAudioContext(<App />);
        container = result.container;
        const filterButton = screen.getByRole('button', { name: 'Filter' });
        fireEvent.click(filterButton);
    });

    test('defaults to lowpass', () => {
        const selector = container.querySelector('#filterSelector');
        const display = selector.querySelector('span');
        expect(display.textContent).toBe('lowpass');
    });

    test('shows all 8 filter types', () => {
        const selector = container.querySelector('#filterSelector');
        const options = selector.querySelectorAll('.selectorVal');
        expect(options.length).toBe(8);
    });
});

describe('Selector (via Reverb)', () => {
    let container;

    beforeEach(() => {
        const result = renderWithAudioContext(<App />);
        container = result.container;
        const reverbButton = screen.getByRole('button', { name: 'Reverb' });
        fireEvent.click(reverbButton);
    });

    test('defaults to Small', () => {
        const selector = container.querySelector('#reverbSelector');
        const display = selector.querySelector('span');
        expect(display.textContent).toBe('Small');
    });

    test('options are Small, Medium, Large', () => {
        const selector = container.querySelector('#reverbSelector');
        const options = selector.querySelectorAll('.selectorVal');
        const values = Array.from(options).map((o) => o.textContent);
        expect(values).toEqual(['Small', 'Medium', 'Large']);
    });
});

describe('Oscillator LFO toggle', () => {
    let container;

    beforeEach(() => {
        const result = renderWithAudioContext(<App />);
        container = result.container;
        const oscButton = screen.getByRole('button', { name: 'Oscillator' });
        fireEvent.click(oscButton);
    });

    test('LFO toggle changes frequency range', () => {
        const numInput = container.querySelector('#oscFreqfreqNumInput');
        expect(numInput.value).toBe('440');

        // Toggle LFO mode
        const checkbox = container.querySelector('#oscSlider input[type="checkbox"]');
        fireEvent.click(checkbox);

        // After LFO, frequency should change to LFO range (mid=10)
        expect(numInput.value).toBe('10');
    });

    test('LFO toggle back restores normal range', () => {
        const checkbox = container.querySelector('#oscSlider input[type="checkbox"]');
        const numInput = container.querySelector('#oscFreqfreqNumInput');

        // Enable LFO
        fireEvent.click(checkbox);
        expect(numInput.value).toBe('10');

        // Disable LFO
        fireEvent.click(checkbox);
        expect(numInput.value).toBe('440');
    });
});

describe('ADSR TextInput controls', () => {
    let container;

    beforeEach(() => {
        const result = renderWithAudioContext(<App />);
        container = result.container;
        const adsrButton = screen.getByRole('button', { name: 'ADSR' });
        fireEvent.click(adsrButton);
    });

    test('renders Attack, Decay, Sustain, Release inputs', () => {
        expect(container.querySelector('#ADSRAttackinputLabel')).toBeTruthy();
        expect(container.querySelector('#ADSRDecayinputLabel')).toBeTruthy();
        expect(container.querySelector('#ADSRSustaininputLabel')).toBeTruthy();
        expect(container.querySelector('#ADSRReleaseinputLabel')).toBeTruthy();
    });

    test('TextInput defaults are correct', () => {
        const attackInput = container.querySelector('#ADSRAttackinputLabel input');
        const decayInput = container.querySelector('#ADSRDecayinputLabel input');
        const sustainInput = container.querySelector('#ADSRSustaininputLabel input');
        const releaseInput = container.querySelector('#ADSRReleaseinputLabel input');

        expect(attackInput.value).toBe('0.2');
        expect(decayInput.value).toBe('0.2');
        expect(sustainInput.value).toBe('0.5');
        expect(releaseInput.value).toBe('0.3');
    });

    test('TextInput rejects non-numeric text', () => {
        const attackInput = container.querySelector('#ADSRAttackinputLabel input');
        fireEvent.change(attackInput, { target: { value: 'abc' } });
        expect(attackInput.value).toBe('0.2');
    });

    test('TextInput accepts valid numbers', () => {
        const attackInput = container.querySelector('#ADSRAttackinputLabel input');
        fireEvent.change(attackInput, { target: { value: '0.5' } });
        expect(attackInput.value).toBe('0.5');
    });

    test('ADSR has pulse button and toggle', () => {
        const pulseButton = screen.getByRole('button', { name: 'Pulse' });
        expect(pulseButton).toBeTruthy();
        const checkbox = container.querySelector('#ADSRCheck input[type="checkbox"]');
        expect(checkbox).toBeTruthy();
    });
});

describe('Recorder module', () => {
    let container;

    beforeEach(() => {
        const result = renderWithAudioContext(<App />);
        container = result.container;
        const recorderButton = screen.getByRole('button', { name: 'Recorder' });
        fireEvent.click(recorderButton);
    });

    test('renders Record and Finish buttons', () => {
        expect(screen.getByRole('button', { name: 'Record' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Finish' })).toBeTruthy();
    });

    test('renders download link', () => {
        const link = container.querySelector('a[download="recordedAudio.ogg"]');
        expect(link).toBeTruthy();
    });

    test('Record button toggles to Pause', () => {
        const recordButton = screen.getByRole('button', { name: 'Record' });
        fireEvent.click(recordButton);
        expect(recordButton.textContent).toBe('Pause');
    });
});

describe('Distortion module', () => {
    let container;

    beforeEach(() => {
        const result = renderWithAudioContext(<App />);
        container = result.container;
        const distButton = screen.getByRole('button', { name: 'Distortion' });
        fireEvent.click(distButton);
    });

    test('renders curve slider and oversample selector', () => {
        const curveRange = container.querySelector('#distortionCurveRange');
        expect(curveRange).toBeTruthy();

        const selector = container.querySelector('#distortionSelector');
        expect(selector).toBeTruthy();
    });

    test('oversample selector has none, 2x, 4x', () => {
        const selector = container.querySelector('#distortionSelector');
        const options = selector.querySelectorAll('.selectorVal');
        const values = Array.from(options).map((o) => o.textContent);
        expect(values).toEqual(['none', '2x', '4x']);
    });
});

describe('Dial (via Filter Q)', () => {
    let container;

    beforeEach(() => {
        const result = renderWithAudioContext(<App />);
        container = result.container;
        const filterButton = screen.getByRole('button', { name: 'Filter' });
        fireEvent.click(filterButton);
    });

    test('renders dial range and numeric input', () => {
        const dialRange = container.querySelector('.dialRange');
        const dialNum = container.querySelector('#dialNumInput');
        expect(dialRange).toBeTruthy();
        expect(dialNum).toBeTruthy();
    });

    test('dial defaults to 0', () => {
        const dialNum = container.querySelector('#dialNumInput');
        expect(dialNum.value).toBe('0');
    });

    test('dial numeric input rejects non-numeric text', () => {
        const dialNum = container.querySelector('#dialNumInput');
        fireEvent.change(dialNum, { target: { value: 'abc' } });
        expect(dialNum.value).toBe('0');
    });

    test('dial numeric input accepts valid numbers', () => {
        const dialNum = container.querySelector('#dialNumInput');
        fireEvent.change(dialNum, { target: { value: '500' } });
        expect(dialNum.value).toBe('500');
    });

    test('dial has tooltip showing Q', () => {
        const tooltip = container.querySelector('#Qdialtip');
        expect(tooltip).toBeTruthy();
        expect(tooltip.textContent).toBe('Q');
    });
});
