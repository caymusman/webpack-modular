import { screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { renderWithAudioContext } from './testUtils';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
        get length() {
            return Object.keys(store).length;
        },
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

describe('PresetBar', () => {
    test('renders preset controls in header', () => {
        renderWithAudioContext(<App />);
        expect(screen.getByLabelText('Preset name')).toBeTruthy();
        expect(screen.getByLabelText('Save preset')).toBeTruthy();
        expect(screen.getByLabelText('Load preset')).toBeTruthy();
        expect(screen.getByLabelText('Export preset')).toBeTruthy();
        expect(screen.getByLabelText('Import preset')).toBeTruthy();
        expect(screen.getByLabelText('Clear all')).toBeTruthy();
    });

    test('save button with name stores preset in localStorage', () => {
        renderWithAudioContext(<App />);

        // Create a module
        fireEvent.click(screen.getByRole('button', { name: 'Gain' }));

        // Type a preset name and save
        const nameInput = screen.getByLabelText('Preset name');
        fireEvent.change(nameInput, { target: { value: 'Test Preset' } });
        fireEvent.click(screen.getByLabelText('Save preset'));

        // Check localStorage
        const stored = localStorage.getItem('presets::Test Preset');
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!);
        expect(parsed.name).toBe('Test Preset');
        expect(parsed.modules.length).toBe(1);
        expect(parsed.modules[0].type).toBe('Gain');
    });

    test('clear removes all modules and cords', () => {
        const { container } = renderWithAudioContext(<App />);

        // Create modules and a cord
        fireEvent.click(screen.getByRole('button', { name: 'Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));

        expect(container.querySelectorAll('.moduleDiv').length).toBe(2);
        expect(container.querySelectorAll('#patchCords line').length).toBe(1);

        // Clear
        fireEvent.click(screen.getByLabelText('Clear all'));

        expect(container.querySelectorAll('.moduleDiv').length).toBe(0);
        expect(container.querySelectorAll('#patchCords line').length).toBe(0);
    });

    test('module creation after save does not collide IDs', () => {
        const { container } = renderWithAudioContext(<App />);

        // Create and save
        fireEvent.click(screen.getByRole('button', { name: 'Gain' }));
        const nameInput = screen.getByLabelText('Preset name');
        fireEvent.change(nameInput, { target: { value: 'ID Test' } });
        fireEvent.click(screen.getByLabelText('Save preset'));

        // Create another module of same type
        fireEvent.click(screen.getByRole('button', { name: 'Gain' }));

        // Should have 2 distinct modules
        expect(container.querySelectorAll('.moduleDiv').length).toBe(2);
    });

    test('save with empty name does nothing', () => {
        renderWithAudioContext(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Gain' }));

        // Try to save with empty name
        fireEvent.click(screen.getByLabelText('Save preset'));

        // No presets should be stored
        expect(localStorage.length).toBe(0);
    });

    test('save clears the name input', () => {
        renderWithAudioContext(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Gain' }));

        const nameInput = screen.getByLabelText('Preset name') as HTMLInputElement;
        fireEvent.change(nameInput, { target: { value: 'My Preset' } });
        fireEvent.click(screen.getByLabelText('Save preset'));

        expect(nameInput.value).toBe('');
    });

    test('Enter key in name input triggers save', () => {
        renderWithAudioContext(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Gain' }));

        const nameInput = screen.getByLabelText('Preset name');
        fireEvent.change(nameInput, { target: { value: 'Enter Test' } });
        fireEvent.keyDown(nameInput, { key: 'Enter' });

        expect(localStorage.getItem('presets::Enter Test')).toBeTruthy();
    });

    test('load dropdown lists saved presets', () => {
        // Save a preset manually
        localStorage.setItem(
            'presets::My Saved',
            JSON.stringify({
                name: 'My Saved',
                modules: [],
                connections: [],
            })
        );

        // Re-render to pick up the preset in the dropdown
        // Since PresetBar initializes savedPresets from listPresets(), we need to re-render
        renderWithAudioContext(<App />);
        fireEvent.click(screen.getByLabelText('Load preset'));

        expect(screen.getByRole('button', { name: 'Load My Saved' })).toBeTruthy();
    });

    test('selecting a preset from load dropdown creates modules', () => {
        // Pre-save a preset
        const preset = {
            name: 'Load Test',
            modules: [
                { key: 'Gain 0', type: 'Gain', inputOnly: false, position: { x: 0, y: 0 }, params: { gain: 0.5 } },
                {
                    key: 'Filter 0',
                    type: 'Filter',
                    inputOnly: false,
                    position: { x: 100, y: 0 },
                    params: { filterType: 'lowpass', frequency: 350, q: 0, gain: 0 },
                },
            ],
            connections: [],
        };
        localStorage.setItem('presets::Load Test', JSON.stringify(preset));

        const { container } = renderWithAudioContext(<App />);

        fireEvent.click(screen.getByLabelText('Load preset'));
        fireEvent.click(screen.getByRole('button', { name: 'Load Load Test' }));

        expect(container.querySelectorAll('.moduleDiv').length).toBe(2);
    });

    test('loading clears existing modules before creating new ones', () => {
        const preset = {
            name: 'Replace',
            modules: [
                { key: 'Panner 0', type: 'Panner', inputOnly: false, position: { x: 0, y: 0 }, params: { pan: 0 } },
            ],
            connections: [],
        };
        localStorage.setItem('presets::Replace', JSON.stringify(preset));

        const { container } = renderWithAudioContext(<App />);

        // Create some modules first
        fireEvent.click(screen.getByRole('button', { name: 'Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
        expect(container.querySelectorAll('.moduleDiv').length).toBe(2);

        // Load preset (should replace)
        fireEvent.click(screen.getByLabelText('Load preset'));
        fireEvent.click(screen.getByRole('button', { name: 'Load Replace' }));

        expect(container.querySelectorAll('.moduleDiv').length).toBe(1);
    });

    test('module creation after load does not collide IDs', () => {
        const preset = {
            name: 'ID Collision',
            modules: [
                { key: 'Gain 0', type: 'Gain', inputOnly: false, position: { x: 0, y: 0 }, params: { gain: 0.5 } },
            ],
            connections: [],
        };
        localStorage.setItem('presets::ID Collision', JSON.stringify(preset));

        const { container } = renderWithAudioContext(<App />);

        // Load preset
        fireEvent.click(screen.getByLabelText('Load preset'));
        fireEvent.click(screen.getByRole('button', { name: 'Load ID Collision' }));

        // Create another Gain module
        fireEvent.click(screen.getByRole('button', { name: 'Gain' }));

        // Should have 2 modules (Gain 0 from preset + Gain 1 from button)
        expect(container.querySelectorAll('.moduleDiv').length).toBe(2);
    });

    test('delete dropdown removes preset from localStorage', () => {
        localStorage.setItem(
            'presets::Delete Me',
            JSON.stringify({
                name: 'Delete Me',
                modules: [],
                connections: [],
            })
        );

        renderWithAudioContext(<App />);

        fireEvent.click(screen.getByLabelText('Load preset'));
        fireEvent.click(screen.getByRole('button', { name: 'Delete Delete Me' }));

        expect(localStorage.getItem('presets::Delete Me')).toBeNull();
    });
});
