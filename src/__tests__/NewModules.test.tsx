import { fireEvent, screen } from '@testing-library/react';
import App from '../App';
import { renderWithAudioContext } from './testUtils';
import { act } from '@testing-library/react';

/** Opens the palette and clicks the named module to add it. */
function addModule(name: string) {
    fireEvent.click(screen.getByRole('button', { name: 'Add module (N)' }));
    fireEvent.click(screen.getByRole('option', { name }));
}

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Compressor
// ---------------------------------------------------------------------------

describe('Compressor module', () => {
    test('renders after being added', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Compressor');
        expect(container.querySelector('.compressorDiv')).toBeTruthy();
    });

    test('has threshold, knee, ratio, attack and release sliders', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Compressor');
        // Slider ids use labelName + 'Range'
        expect(container.querySelector('#compThresholdRange')).toBeTruthy();
        expect(container.querySelector('#compKneeRange')).toBeTruthy();
        expect(container.querySelector('#compRatioRange')).toBeTruthy();
        expect(container.querySelector('#compAttackRange')).toBeTruthy();
        expect(container.querySelector('#compReleaseRange')).toBeTruthy();
    });

    test('threshold slider changes value', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Compressor');
        const slider = container.querySelector('#compThresholdRange');
        fireEvent.change(slider, { target: { value: '-50' } });
        expect(slider.value).toBe('-50');
    });

    test('has input dock (inputOnly is false)', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Compressor');
        expect(container.querySelector('#inputOuter')).toBeTruthy();
    });
});

// ---------------------------------------------------------------------------
// Noise
// ---------------------------------------------------------------------------

describe('Noise module', () => {
    test('renders after being added', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Noise');
        expect(container.querySelector('.noiseDiv')).toBeTruthy();
    });

    test('shows noise type selector', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Noise');
        expect(container.querySelector('#noiseSelector')).toBeTruthy();
        // The selected value is shown as an option
        const selected = container.querySelector('#noiseSelector [aria-selected="true"]');
        expect(selected?.textContent).toBe('white');
    });

    test('has gain slider', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Noise');
        expect(container.querySelector('#noiseGainRange')).toBeTruthy();
    });

    test('does NOT have input dock (inputOnly is true)', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Noise');
        expect(container.querySelector('#inputOuter')).toBeNull();
    });

    test('clicking noise type option changes selected value', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Noise');
        // Open the selector then click 'pink'
        const selector = container.querySelector('#noiseSelector');
        fireEvent.click(selector.querySelector('[aria-selected="true"]'));
        // Find and click 'pink' option in the open dropdown
        const options = selector.querySelectorAll('.selectorVal');
        const pinkOption = Array.from(options).find((el) => el.textContent === 'pink');
        fireEvent.click(pinkOption);
        const selected = container.querySelector('#noiseSelector [aria-selected="true"]');
        expect(selected?.textContent).toBe('pink');
    });
});

// ---------------------------------------------------------------------------
// LFO
// ---------------------------------------------------------------------------

describe('LFO module', () => {
    test('renders after being added', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('LFO');
        expect(container.querySelector('.lfoDiv')).toBeTruthy();
    });

    test('has rate and depth inputs', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('LFO');
        // LogSlider uses labelName + 'freqNumInput' for the number input
        expect(container.querySelector('#lfoRatefreqNumInput')).toBeTruthy();
        // Slider uses labelName + 'Range' for the range input
        expect(container.querySelector('#lfoDepthRange')).toBeTruthy();
    });

    test('has waveform selector', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('LFO');
        expect(container.querySelector('#lfoWaveSelector')).toBeTruthy();
        const selected = container.querySelector('#lfoWaveSelector [aria-selected="true"]');
        expect(selected?.textContent).toBe('sine');
    });

    test('does NOT have input dock (inputOnly is true)', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('LFO');
        expect(container.querySelector('#inputOuter')).toBeNull();
    });

    test('depth slider accepts values', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('LFO');
        const slider = container.querySelector('#lfoDepthRange');
        fireEvent.change(slider, { target: { value: '500' } });
        expect(slider.value).toBe('500');
    });
});

// ---------------------------------------------------------------------------
// Sequencer
// ---------------------------------------------------------------------------

describe('Sequencer module', () => {
    test('renders after being added', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Sequencer');
        expect(container.querySelector('.sequencerDiv')).toBeTruthy();
    });

    test('renders 8 step buttons by default', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Sequencer');
        const stepNotes = container.querySelectorAll('.sequencerDiv__stepNote');
        expect(stepNotes.length).toBe(8);
    });

    test('renders 8 step toggle buttons by default', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Sequencer');
        const toggles = container.querySelectorAll('.sequencerDiv__stepToggle');
        expect(toggles.length).toBe(8);
    });

    test('has play/stop button', () => {
        renderWithAudioContext(<App />);
        addModule('Sequencer');
        expect(screen.getByRole('button', { name: 'Play sequencer' })).toBeTruthy();
    });

    test('play button changes to stop after clicking', () => {
        renderWithAudioContext(<App />);
        addModule('Sequencer');
        fireEvent.click(screen.getByRole('button', { name: 'Play sequencer' }));
        expect(screen.getByRole('button', { name: 'Stop sequencer' })).toBeTruthy();
    });

    test('stop button changes back to play after clicking', () => {
        renderWithAudioContext(<App />);
        addModule('Sequencer');
        fireEvent.click(screen.getByRole('button', { name: 'Play sequencer' }));
        fireEvent.click(screen.getByRole('button', { name: 'Stop sequencer' }));
        expect(screen.getByRole('button', { name: 'Play sequencer' })).toBeTruthy();
    });

    test('has BPM slider', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Sequencer');
        // Slider uses labelName + 'Range'
        expect(container.querySelector('#seqBpmRange')).toBeTruthy();
    });

    test('has waveform selector', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Sequencer');
        expect(container.querySelector('#seqWaveSelector')).toBeTruthy();
        const selected = container.querySelector('#seqWaveSelector [aria-selected="true"]');
        expect(selected?.textContent).toBe('sine');
    });

    test('does NOT have input dock (inputOnly is true)', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Sequencer');
        expect(container.querySelector('#inputOuter')).toBeNull();
    });

    test('step count shows 8 initially', () => {
        renderWithAudioContext(<App />);
        addModule('Sequencer');
        expect(screen.getByLabelText('Step count: 8')).toBeTruthy();
    });

    test('clicking Add step increases step count to 9', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Sequencer');
        fireEvent.click(screen.getByRole('button', { name: 'Add step' }));
        expect(screen.getByLabelText('Step count: 9')).toBeTruthy();
        expect(container.querySelectorAll('.sequencerDiv__stepNote').length).toBe(9);
    });

    test('clicking Remove step decreases step count to 7', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Sequencer');
        fireEvent.click(screen.getByRole('button', { name: 'Remove step' }));
        expect(screen.getByLabelText('Step count: 7')).toBeTruthy();
        expect(container.querySelectorAll('.sequencerDiv__stepNote').length).toBe(7);
    });

    test('Remove step button is disabled at minimum of 2', () => {
        renderWithAudioContext(<App />);
        addModule('Sequencer');
        for (let i = 0; i < 6; i++) {
            fireEvent.click(screen.getByRole('button', { name: 'Remove step' }));
        }
        const btn = screen.getByRole('button', { name: 'Remove step' });
        expect((btn as HTMLButtonElement).disabled).toBe(true);
    });

    test('Add step button is disabled at maximum of 16', () => {
        renderWithAudioContext(<App />);
        addModule('Sequencer');
        for (let i = 0; i < 8; i++) {
            fireEvent.click(screen.getByRole('button', { name: 'Add step' }));
        }
        const btn = screen.getByRole('button', { name: 'Add step' });
        expect((btn as HTMLButtonElement).disabled).toBe(true);
    });

    test('clicking a step note cycles it up', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Sequencer');
        const firstStep = container.querySelectorAll('.sequencerDiv__stepNote')[0];
        const initialText = firstStep.textContent;
        fireEvent.click(firstStep);
        expect(firstStep.textContent).not.toBe(initialText);
    });

    test('clicking step toggle mutes and unmutes a step', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Sequencer');
        const toggle = container.querySelectorAll('.sequencerDiv__stepToggle')[0];
        expect(toggle.classList.contains('sequencerDiv__stepToggle--on')).toBe(true);
        fireEvent.click(toggle);
        expect(toggle.classList.contains('sequencerDiv__stepToggle--on')).toBe(false);
        fireEvent.click(toggle);
        expect(toggle.classList.contains('sequencerDiv__stepToggle--on')).toBe(true);
    });

    test('closing sequencer module removes it', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Sequencer');
        fireEvent.click(screen.getByRole('button', { name: 'Close Sequencer' }));
        act(() => vi.advanceTimersByTime(300));
        expect(container.querySelector('.sequencerDiv')).toBeNull();
    });
});
