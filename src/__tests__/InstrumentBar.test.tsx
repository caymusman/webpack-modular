import { screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { renderWithAudioContext } from './testUtils';
import { Instrument } from '../types';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
        get length() { return Object.keys(store).length; },
        key: (i: number) => Object.keys(store)[i] ?? null,
    };
})();

beforeEach(() => {
    localStorageMock.clear();
    vi.stubGlobal('localStorage', localStorageMock);
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

const simpleInstrument: Instrument = {
    name: 'My Synth',
    modules: [
        { key: 'Gain 0', type: 'Gain', inputOnly: false, position: { x: 0, y: 0 }, params: { gain: 0.8 } },
    ],
    connections: [],
};

const twoModuleInstrument: Instrument = {
    name: 'Voice',
    modules: [
        { key: 'Oscillator 0', type: 'Oscillator', inputOnly: true, position: { x: 0, y: 0 }, params: {} },
        { key: 'Filter 0', type: 'Filter', inputOnly: false, position: { x: 200, y: 0 }, params: {} },
    ],
    connections: [{ fromModID: 'Oscillator 0', toModID: 'Filter 0' }],
};

/** Opens the module palette and adds a module by name. */
function addModule(name: string) {
    fireEvent.click(screen.getByRole('button', { name: 'Add module (N)' }));
    fireEvent.click(screen.getByRole('option', { name }));
}

/** Selects all modules then groups them via keyboard shortcut. */
function createGroup() {
    act(() => {
        fireEvent.keyDown(window, { key: 'a', ctrlKey: true });
    });
    act(() => {
        fireEvent.keyDown(window, { key: 'g', ctrlKey: true });
    });
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('InstrumentBar rendering', () => {
    test('renders Instruments button and Import button', () => {
        renderWithAudioContext(<App />);
        expect(screen.getByLabelText('Instrument library')).toBeTruthy();
        expect(screen.getByLabelText('Import instrument from file')).toBeTruthy();
    });

    test('dropdown shows "No saved instruments" when library is empty', () => {
        renderWithAudioContext(<App />);
        fireEvent.click(screen.getByLabelText('Instrument library'));
        expect(screen.getByText('No saved instruments')).toBeTruthy();
    });

    test('dropdown lists pre-saved instruments', () => {
        localStorage.setItem('instruments::My Synth', JSON.stringify(simpleInstrument));
        renderWithAudioContext(<App />);

        fireEvent.click(screen.getByLabelText('Instrument library'));
        expect(screen.getByRole('option', { name: 'Add My Synth to patch' })).toBeTruthy();
    });

    test('count badge shows number of saved instruments', () => {
        localStorage.setItem('instruments::Bass', JSON.stringify(simpleInstrument));
        localStorage.setItem('instruments::Lead', JSON.stringify(simpleInstrument));
        renderWithAudioContext(<App />);

        // The badge text "2" should appear somewhere in the InstrumentBar header
        const btn = screen.getByLabelText('Instrument library');
        expect(btn.textContent).toContain('2');
    });

    test('dropdown closes when clicking outside', () => {
        localStorage.setItem('instruments::Test', JSON.stringify(simpleInstrument));
        renderWithAudioContext(<App />);

        fireEvent.click(screen.getByLabelText('Instrument library'));
        expect(screen.queryByRole('listbox', { name: 'Saved instruments' })).toBeTruthy();

        fireEvent.mouseDown(document.body);
        expect(screen.queryByRole('listbox', { name: 'Saved instruments' })).toBeNull();
    });
});

// ─── Add to patch ─────────────────────────────────────────────────────────────

describe('InstrumentBar add to patch', () => {
    test('clicking an instrument name adds its modules to the canvas', () => {
        localStorage.setItem('instruments::My Synth', JSON.stringify(simpleInstrument));
        const { container } = renderWithAudioContext(<App />);

        fireEvent.click(screen.getByLabelText('Instrument library'));
        fireEvent.click(screen.getByRole('option', { name: 'Add My Synth to patch' }));

        expect(container.querySelectorAll('.moduleDiv').length).toBe(1);
    });

    test('adding a two-module instrument creates both modules', () => {
        localStorage.setItem('instruments::Voice', JSON.stringify(twoModuleInstrument));
        const { container } = renderWithAudioContext(<App />);

        fireEvent.click(screen.getByLabelText('Instrument library'));
        fireEvent.click(screen.getByRole('option', { name: 'Add Voice to patch' }));

        expect(container.querySelectorAll('.moduleDiv').length).toBe(2);
    });

    test('adding instrument creates a group box on canvas', () => {
        localStorage.setItem('instruments::My Synth', JSON.stringify(simpleInstrument));
        const { container } = renderWithAudioContext(<App />);

        fireEvent.click(screen.getByLabelText('Instrument library'));
        fireEvent.click(screen.getByRole('option', { name: 'Add My Synth to patch' }));

        expect(container.querySelector('.groupBox')).toBeTruthy();
    });

    test('adding instrument twice creates separate modules without ID collision', () => {
        localStorage.setItem('instruments::My Synth', JSON.stringify(simpleInstrument));
        const { container } = renderWithAudioContext(<App />);

        fireEvent.click(screen.getByLabelText('Instrument library'));
        fireEvent.click(screen.getByRole('option', { name: 'Add My Synth to patch' }));

        fireEvent.click(screen.getByLabelText('Instrument library'));
        fireEvent.click(screen.getByRole('option', { name: 'Add My Synth to patch' }));

        expect(container.querySelectorAll('.moduleDiv').length).toBe(2);
    });

    test('adding instrument does not remove existing modules', () => {
        localStorage.setItem('instruments::My Synth', JSON.stringify(simpleInstrument));
        const { container } = renderWithAudioContext(<App />);

        addModule('Filter');
        expect(container.querySelectorAll('.moduleDiv').length).toBe(1);

        fireEvent.click(screen.getByLabelText('Instrument library'));
        fireEvent.click(screen.getByRole('option', { name: 'Add My Synth to patch' }));

        expect(container.querySelectorAll('.moduleDiv').length).toBe(2);
    });

    test('dropdown closes after adding instrument', () => {
        localStorage.setItem('instruments::My Synth', JSON.stringify(simpleInstrument));
        renderWithAudioContext(<App />);

        fireEvent.click(screen.getByLabelText('Instrument library'));
        fireEvent.click(screen.getByRole('option', { name: 'Add My Synth to patch' }));

        expect(screen.queryByRole('listbox', { name: 'Saved instruments' })).toBeNull();
    });
});

// ─── Delete ───────────────────────────────────────────────────────────────────

describe('InstrumentBar delete', () => {
    test('delete button removes instrument from library', () => {
        localStorage.setItem('instruments::ToDelete', JSON.stringify(simpleInstrument));
        renderWithAudioContext(<App />);

        fireEvent.click(screen.getByLabelText('Instrument library'));
        fireEvent.click(screen.getByRole('button', { name: 'Delete ToDelete' }));

        expect(localStorage.getItem('instruments::ToDelete')).toBeNull();
    });

    test('deleting an instrument removes it from the dropdown list', () => {
        localStorage.setItem('instruments::Vanish', JSON.stringify(simpleInstrument));
        renderWithAudioContext(<App />);

        fireEvent.click(screen.getByLabelText('Instrument library'));
        fireEvent.click(screen.getByRole('button', { name: 'Delete Vanish' }));

        expect(screen.queryByRole('option', { name: 'Add Vanish to patch' })).toBeNull();
        expect(screen.getByText('No saved instruments')).toBeTruthy();
    });
});

// ─── GroupBox save-as-instrument ─────────────────────────────────────────────

describe('GroupBox save as instrument', () => {
    test('save-as-instrument button appears on a group', () => {
        renderWithAudioContext(<App />);
        addModule('Gain');
        createGroup();

        expect(screen.getByLabelText('Save Group 1 as instrument')).toBeTruthy();
    });

    test('clicking save-as-instrument stores instrument in localStorage', () => {
        renderWithAudioContext(<App />);
        addModule('Gain');
        createGroup();

        fireEvent.click(screen.getByLabelText('Save Group 1 as instrument'));

        // Instrument should be stored under the group name
        const stored = localStorage.getItem('instruments::Group 1');
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!) as Instrument;
        expect(parsed.name).toBe('Group 1');
        expect(parsed.modules).toHaveLength(1);
        expect(parsed.modules[0].type).toBe('Gain');
    });

    test('instrument count badge updates after saving from GroupBox', () => {
        renderWithAudioContext(<App />);
        addModule('Gain');
        createGroup();

        // Before save: no count
        const btn = screen.getByLabelText('Instrument library');
        expect(btn.textContent).not.toContain('1');

        fireEvent.click(screen.getByLabelText('Save Group 1 as instrument'));

        // After save: badge shows 1
        expect(btn.textContent).toContain('1');
    });

    test('saved instrument appears in dropdown immediately', () => {
        renderWithAudioContext(<App />);
        addModule('Gain');
        createGroup();

        fireEvent.click(screen.getByLabelText('Save Group 1 as instrument'));
        fireEvent.click(screen.getByLabelText('Instrument library'));

        expect(screen.getByRole('option', { name: 'Add Group 1 to patch' })).toBeTruthy();
    });
});
