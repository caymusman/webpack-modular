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

// ---------------------------------------------------------------------------
// Switch
// ---------------------------------------------------------------------------

describe('Switch module', () => {
    test('renders .switchDiv after being added', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Switch');
        expect(container.querySelector('.switchDiv')).toBeTruthy();
    });

    test('does NOT have a standard #inputOuter dock (inputOnly=true)', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Switch');
        expect(container.querySelector('#inputOuter')).toBeNull();
    });

    test('has an output send dock (not sinkOnly)', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Switch');
        expect(container.querySelector('#outputOuter')).toBeTruthy();
    });

    test('renders 2 channel input docks by default', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Switch');
        const docks = container.querySelectorAll('.switch__ch-top-dock');
        expect(docks.length).toBe(2);
    });

    test('channel dock labels are A and B by default', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Switch');
        const labels = Array.from(
            container.querySelectorAll('.switch__ch-top-dock .switch__dock-label')
        ).map((el) => el.textContent);
        expect(labels).toEqual(['A', 'B']);
    });

    test('has a CV input dock', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Switch');
        expect(container.querySelector('.switch__cv-top-dock')).toBeTruthy();
    });

    test('CV dock label reads CV', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Switch');
        const cvLabel = container.querySelector('.switch__cv-top-dock .switch__dock-label');
        expect(cvLabel?.textContent).toBe('CV');
    });

    test('channel A select button is initially active (● symbol)', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Switch');
        const buttons = container.querySelectorAll('.switch__ch-select');
        expect(buttons[0].textContent).toBe('●');
        expect(buttons[1].textContent).toBe('○');
    });

    test('clicking channel B button makes it active', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Switch');
        const buttons = container.querySelectorAll('.switch__ch-select');
        fireEvent.click(buttons[1]); // click B
        expect(buttons[1].textContent).toBe('●');
        expect(buttons[0].textContent).toBe('○');
    });

    test('active channel row has --active class', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Switch');
        const channels = container.querySelectorAll('.switch__channel');
        expect(channels[0].classList.contains('switch__channel--active')).toBe(true);
        expect(channels[1].classList.contains('switch__channel--active')).toBe(false);
    });

    test('clicking channel B row button updates active class', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Switch');
        const buttons = container.querySelectorAll('.switch__ch-select');
        fireEvent.click(buttons[1]);
        const channels = container.querySelectorAll('.switch__channel');
        expect(channels[0].classList.contains('switch__channel--active')).toBe(false);
        expect(channels[1].classList.contains('switch__channel--active')).toBe(true);
    });

    test('has an "Inputs" label in the header', () => {
        renderWithAudioContext(<App />);
        addModule('Switch');
        expect(screen.getByText('Inputs')).toBeTruthy();
    });

    test('has a channel count selector showing "2" initially', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Switch');
        const selector = container.querySelector('.switch__count .selectorDiv');
        expect(selector).toBeTruthy();
        const display = selector!.querySelector('span[role="option"]');
        expect(display?.textContent).toBe('2');
    });

    test('changing channel count to 3 renders 3 channel docks', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Switch');
        const selector = container.querySelector('.switch__count .selectorDiv');
        const threeOption = Array.from(selector!.querySelectorAll('.selectorVal')).find(
            (el) => el.textContent === '3'
        );
        fireEvent.click(threeOption!);
        expect(container.querySelectorAll('.switch__ch-top-dock').length).toBe(3);
    });

    test('changing channel count to 4 renders 4 channel docks', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Switch');
        const selector = container.querySelector('.switch__count .selectorDiv');
        const fourOption = Array.from(selector!.querySelectorAll('.selectorVal')).find(
            (el) => el.textContent === '4'
        );
        fireEvent.click(fourOption!);
        expect(container.querySelectorAll('.switch__ch-top-dock').length).toBe(4);
    });

    test('reducing channel count removes extra docks', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Switch');
        const selector = container.querySelector('.switch__count .selectorDiv');

        // First expand to 4
        fireEvent.click(
            Array.from(selector!.querySelectorAll('.selectorVal')).find((el) => el.textContent === '4')!
        );
        expect(container.querySelectorAll('.switch__ch-top-dock').length).toBe(4);

        // Then reduce back to 2
        fireEvent.click(
            Array.from(selector!.querySelectorAll('.selectorVal')).find((el) => el.textContent === '2')!
        );
        expect(container.querySelectorAll('.switch__ch-top-dock').length).toBe(2);
    });

    test('has a rate slider', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Switch');
        const rateSlider = container.querySelector('.switch__rate input[type="range"]');
        expect(rateSlider).toBeTruthy();
    });

    test('rate slider defaults to 0 (off)', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Switch');
        const rateSlider = container.querySelector<HTMLInputElement>('.switch__rate input[type="range"]');
        expect(rateSlider?.value).toBe('0');
    });

    test('rate value display shows "off" at 0', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Switch');
        const rateVal = container.querySelector('.switch__rate-val');
        expect(rateVal?.textContent).toBe('off');
    });

    test('rate value display shows Hz value when non-zero', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Switch');
        const rateSlider = container.querySelector('.switch__rate input[type="range"]');
        fireEvent.change(rateSlider!, { target: { value: '5' } });
        const rateVal = container.querySelector('.switch__rate-val');
        expect(rateVal?.textContent).toContain('Hz');
    });

    test('closing Switch module removes it', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Switch');
        fireEvent.click(screen.getByRole('button', { name: 'Close Switch' }));
        act(() => vi.advanceTimersByTime(300));
        expect(container.querySelector('.switchDiv')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// AudioClip
// ---------------------------------------------------------------------------

describe('AudioClip module', () => {
    test('renders .audioClipDiv after being added', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Audio Clip');
        expect(container.querySelector('.audioClipDiv')).toBeTruthy();
    });

    test('does NOT have a standard #inputOuter dock (inputOnly=true)', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Audio Clip');
        expect(container.querySelector('#inputOuter')).toBeNull();
    });

    test('has an output send dock (not sinkOnly)', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Audio Clip');
        expect(container.querySelector('#outputOuter')).toBeTruthy();
    });

    test('shows "No file loaded" when no buffer', () => {
        renderWithAudioContext(<App />);
        addModule('Audio Clip');
        expect(screen.getByText('No file loaded')).toBeTruthy();
    });

    test('shows placeholder area when no buffer loaded', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Audio Clip');
        expect(container.querySelector('.audioClip__placeholder')).toBeTruthy();
    });

    test('does NOT show waveform canvas before a file is loaded', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Audio Clip');
        expect(container.querySelector('canvas.audioClip__wave')).toBeNull();
    });

    test('does NOT show trim inputs before a file is loaded', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Audio Clip');
        expect(container.querySelector('.audioClip__trim')).toBeNull();
    });

    test('play button is disabled when no buffer loaded', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Audio Clip');
        const playBtn = container.querySelector<HTMLButtonElement>('.audioClip__playBtn');
        expect(playBtn?.disabled).toBe(true);
    });

    test('play button shows ▶ initially', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Audio Clip');
        const playBtn = container.querySelector('.audioClip__playBtn');
        expect(playBtn?.textContent).toBe('▶');
    });

    test('has a load file button (folder-open icon)', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Audio Clip');
        expect(container.querySelector('.audioClip__loadBtn')).toBeTruthy();
        expect(container.querySelector('.audioClip__loadBtn .fa-folder-open')).toBeTruthy();
    });

    test('has a loop checkbox', () => {
        renderWithAudioContext(<App />);
        addModule('Audio Clip');
        const loopCheckbox = screen.getByRole('checkbox', { name: 'Loop' });
        expect(loopCheckbox).toBeTruthy();
    });

    test('loop checkbox defaults to checked (loop=true)', () => {
        renderWithAudioContext(<App />);
        addModule('Audio Clip');
        const loopCheckbox = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Loop' });
        expect(loopCheckbox.checked).toBe(true);
    });

    test('toggling loop checkbox changes its state', () => {
        renderWithAudioContext(<App />);
        addModule('Audio Clip');
        const loopCheckbox = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Loop' });
        fireEvent.click(loopCheckbox);
        expect(loopCheckbox.checked).toBe(false);
    });

    test('has a playback rate slider', () => {
        renderWithAudioContext(<App />);
        addModule('Audio Clip');
        const rateSlider = screen.getByRole('slider', { name: 'Playback rate' });
        expect(rateSlider).toBeTruthy();
    });

    test('rate slider defaults to 1×', () => {
        renderWithAudioContext(<App />);
        addModule('Audio Clip');
        const rateSlider = screen.getByRole<HTMLInputElement>('slider', { name: 'Playback rate' });
        expect(rateSlider.value).toBe('1');
    });

    test('rate value display shows "1.00×" initially', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Audio Clip');
        const rateVal = container.querySelector('.audioClip__rateVal');
        expect(rateVal?.textContent).toBe('1.00×');
    });

    test('changing rate slider updates the display', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Audio Clip');
        const rateSlider = screen.getByRole('slider', { name: 'Playback rate' });
        fireEvent.change(rateSlider, { target: { value: '2' } });
        const rateVal = container.querySelector('.audioClip__rateVal');
        expect(rateVal?.textContent).toBe('2.00×');
    });

    test('does NOT show the clear button before a file is loaded', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Audio Clip');
        expect(container.querySelector('.audioClip__clearBtn')).toBeNull();
    });

    test('closing AudioClip module removes it', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Audio Clip');
        fireEvent.click(screen.getByRole('button', { name: 'Close Audio Clip' }));
        act(() => vi.advanceTimersByTime(300));
        expect(container.querySelector('.audioClipDiv')).toBeNull();
    });
});
