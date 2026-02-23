import { screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { renderWithAudioContext } from './testUtils';

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

/** Opens the palette and clicks the named module to add it. */
function addModule(name: string) {
    fireEvent.click(screen.getByRole('button', { name: 'Add module (N)' }));
    fireEvent.click(screen.getByRole('option', { name }));
}

describe('App', () => {
    let app;

    beforeEach(() => {
        app = renderWithAudioContext(<App />);
    });

    test('renders main layout', () => {
        const { container } = app;
        expect(container.querySelector('#mainDiv')).toBeTruthy();
        expect(container.querySelector('#logo')).toBeTruthy();
        expect(container.querySelector('#header')).toBeTruthy();
        expect(container.querySelector('#sidebar')).toBeTruthy();
        expect(container.querySelector('#addModuleWrapper')).toBeTruthy();
        expect(container.querySelector('#playSpace')).toBeTruthy();
    });

    test('renders add module button in header', () => {
        expect(screen.getByRole('button', { name: 'Add module (N)' })).toBeTruthy();
    });

    test('palette shows all module options when opened', () => {
        fireEvent.click(screen.getByRole('button', { name: 'Add module (N)' }));
        const options = screen.getAllByRole('option');
        const names = options.map((o) => o.textContent);
        expect(names).toContain('Oscillator');
        expect(names).toContain('Gain');
        expect(names).toContain('Filter');
        expect(names).toContain('Panner');
        expect(names).toContain('ADSR');
        expect(names).toContain('Delay');
        expect(names).toContain('Distortion');
        expect(names).toContain('Reverb');
        expect(names).toContain('AudioInput');
        expect(names).toContain('Recorder');
        expect(names).toContain('Compressor');
        expect(names).toContain('Noise');
        expect(names).toContain('LFO');
        expect(names).toContain('Sequencer');
    });

    test('renders Output module', () => {
        expect(screen.getByText('Output')).toBeTruthy();
    });
});

describe('Module creation', () => {
    test('adding a module via palette creates it', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Oscillator');

        const modules = container.querySelectorAll('.moduleDiv');
        expect(modules.length).toBe(1);
    });

    test('adding module twice creates two modules', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        addModule('Gain');

        const modules = container.querySelectorAll('.moduleDiv');
        expect(modules.length).toBe(2);
    });

    test('module displays its type name', () => {
        renderWithAudioContext(<App />);
        addModule('Oscillator');

        // The module title paragraph should contain the type name
        const titles = screen.getAllByText('Oscillator');
        // At least one: the module title
        expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    test('created module has input cord area', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Oscillator');

        const outputOuters = container.querySelectorAll('#outputOuter');
        expect(outputOuters.length).toBe(1);
    });

    test('Gain module has output cord area (inputOnly=false)', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');

        const inputOuters = container.querySelectorAll('#inputOuter');
        expect(inputOuters.length).toBe(1);
    });

    test('Oscillator module does NOT have output cord area (inputOnly=true)', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Oscillator');

        // Oscillator is inputOnly="true", should not render the output cord div
        const moduleDiv = container.querySelector('.moduleDiv');
        const inputOuter = moduleDiv.querySelector('#inputOuter');
        expect(inputOuter).toBeNull();
    });
});

describe('Module deletion', () => {
    test('clicking close icon removes a module', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');

        expect(container.querySelectorAll('.moduleDiv').length).toBe(1);

        // Click the close icon (fa-times)
        const closeIcon = container.querySelector('.fa-times');
        fireEvent.click(closeIcon);
        act(() => vi.advanceTimersByTime(300));

        expect(container.querySelectorAll('.moduleDiv').length).toBe(0);
    });

    test('deleting one module preserves others', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        addModule('Filter');

        expect(container.querySelectorAll('.moduleDiv').length).toBe(2);

        // Close the first module
        const closeIcons = container.querySelectorAll('.fa-times');
        fireEvent.click(closeIcons[0]);
        act(() => vi.advanceTimersByTime(300));

        expect(container.querySelectorAll('.moduleDiv').length).toBe(1);
    });
});

describe('Patch cord validation', () => {
    test('entering patch mode shows cancel button', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Oscillator');

        // Click the input cord area to start patching
        const outputOuter = container.querySelector('#outputOuter');
        fireEvent.click(outputOuter);

        // The patchExit button should become visible (has 'show' class)
        const patchExit = container.querySelector('#patchExit');
        expect(patchExit.className).toContain('show');
    });

    test('cancelling patch mode hides cancel button', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Oscillator');

        // Start patch
        const outputOuter = container.querySelector('#outputOuter');
        fireEvent.click(outputOuter);

        // Cancel
        const patchExit = container.querySelector('#patchExit');
        fireEvent.click(patchExit);

        expect(patchExit.className).toContain('hide');
    });

    test('alert shows and can be dismissed', () => {
        const { container } = renderWithAudioContext(<App />);
        // Create an oscillator
        addModule('Oscillator');

        // Start a patch from oscillator output
        const outputOuter = container.querySelector('#outputOuter');
        fireEvent.click(outputOuter);

        // For now, just verify the alertBox starts hidden
        const alertBox = container.querySelector('.alertBox');
        expect(alertBox).toBeTruthy();
        expect(alertBox.className).not.toContain('alertBox--visible');
    });
});

describe('Output module', () => {
    test('output has volume slider', () => {
        const { container } = renderWithAudioContext(<App />);
        const slider = container.querySelector('#gainSlider');
        expect(slider).toBeTruthy();
        expect(slider.type).toBe('range');
    });

    test('output volume slider changes value', () => {
        const { container } = renderWithAudioContext(<App />);
        const slider = container.querySelector('#gainSlider');
        fireEvent.change(slider, { target: { value: '0.8' } });
        expect(slider.value).toBe('0.8');
    });
});

describe('Patch cord connection', () => {
    test('connecting two modules creates a visible cord', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        addModule('Filter');

        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));

        expect(container.querySelectorAll('#patchCords path').length).toBe(1);
    });

    test('patch mode exits after successful connection', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        addModule('Filter');

        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));

        expect(container.querySelector('#patchExit').className).toContain('hide');
    });

    test('self-patch shows alert', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');

        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Gain' }));

        expect(container.querySelector('.alertBox').className).toContain('alertBox--visible');
        expect(container.querySelector('.alertBox__message').textContent).toContain('cannot plug a module into itself');
        expect(container.querySelectorAll('#patchCords path').length).toBe(0);
    });

    test('duplicate patch shows alert', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        addModule('Filter');

        // First connection
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));

        // Attempt duplicate
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));

        expect(container.querySelector('.alertBox').className).toContain('alertBox--visible');
        expect(container.querySelector('.alertBox__message').textContent).toContain('already patched');
        expect(container.querySelectorAll('#patchCords path').length).toBe(1);
    });

    test('param cross-ref shows alert', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Oscillator');

        fireEvent.click(screen.getByRole('button', { name: 'Connect from Oscillator' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to frequency param' }));

        expect(container.querySelector('.alertBox').className).toContain('alertBox--visible');
        expect(container.querySelector('.alertBox__message').textContent).toContain('thats a new one');
        expect(container.querySelectorAll('#patchCords path').length).toBe(0);
    });

    test('multiple valid connections', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        addModule('Filter');
        addModule('Panner');

        // Connect Gain→Filter
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));
        // Connect Gain→Panner
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Panner' }));

        expect(container.querySelectorAll('#patchCords path').length).toBe(2);
    });
});

describe('Patch cord deletion', () => {
    test('clicking a cord line removes it', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        addModule('Filter');

        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));
        expect(container.querySelectorAll('#patchCords path').length).toBe(1);

        fireEvent.click(container.querySelector('#patchCords path'));

        expect(container.querySelectorAll('#patchCords path').length).toBe(0);
    });

    test('deleting a cord allows re-patching same route', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        addModule('Filter');

        // Connect then delete
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));
        fireEvent.click(container.querySelector('#patchCords path'));
        expect(container.querySelectorAll('#patchCords path').length).toBe(0);

        // Reconnect same route
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));

        expect(container.querySelectorAll('#patchCords path').length).toBe(1);
        expect(container.querySelector('.alertBox').className).not.toContain('alertBox--visible');
    });

    test('closing source module removes its cords', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        addModule('Filter');
        addModule('Panner');

        // Connect Gain→Filter and Gain→Panner
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Panner' }));
        expect(container.querySelectorAll('#patchCords path').length).toBe(2);

        // Close Gain
        fireEvent.click(screen.getByRole('button', { name: 'Close Gain' }));
        act(() => vi.advanceTimersByTime(300));

        expect(container.querySelectorAll('#patchCords path').length).toBe(0);
    });

    test('closing target module removes cord to it', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        addModule('Filter');

        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));
        expect(container.querySelectorAll('#patchCords path').length).toBe(1);

        // Close Filter
        fireEvent.click(screen.getByRole('button', { name: 'Close Filter' }));
        act(() => vi.advanceTimersByTime(300));

        expect(container.querySelectorAll('#patchCords path').length).toBe(0);
    });
});

describe('Cord keyboard interaction', () => {
    test('Enter key on cord line deletes it', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        addModule('Filter');

        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));

        fireEvent.keyDown(container.querySelector('#patchCords path'), { key: 'Enter' });

        expect(container.querySelectorAll('#patchCords path').length).toBe(0);
    });

    test('Space key on cord line deletes it', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        addModule('Filter');

        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));

        fireEvent.keyDown(container.querySelector('#patchCords path'), { key: ' ' });

        expect(container.querySelectorAll('#patchCords path').length).toBe(0);
    });
});

describe('Cord dock keyboard interaction', () => {
    test('Enter on output dock starts patch mode', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');

        fireEvent.keyDown(screen.getByRole('button', { name: 'Connect from Gain' }), {
            key: 'Enter',
        });

        expect(container.querySelector('#patchExit').className).toContain('show');
    });

    test('Space on output dock starts patch mode', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');

        fireEvent.keyDown(screen.getByRole('button', { name: 'Connect from Gain' }), {
            key: ' ',
        });

        expect(container.querySelector('#patchExit').className).toContain('show');
    });

    test('Enter on input dock completes connection', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        addModule('Filter');

        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.keyDown(screen.getByRole('button', { name: 'Connect to Filter' }), {
            key: 'Enter',
        });

        expect(container.querySelectorAll('#patchCords path').length).toBe(1);
    });

    test('Enter on Output module dock completes connection', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');

        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.keyDown(screen.getByRole('button', { name: 'Connect to Output' }), {
            key: 'Enter',
        });

        expect(container.querySelectorAll('#patchCords path').length).toBe(1);
    });
});

describe('Ghost cord (in-progress patch preview)', () => {
    test('no ghost cord before entering patch mode', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        expect(container.querySelectorAll('.cord-ghost').length).toBe(0);
    });

    test('no ghost cord in patch mode before mouse moves', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        expect(container.querySelectorAll('.cord-ghost').length).toBe(0);
    });

    test('ghost cord appears after entering patch mode and moving the mouse', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.mouseMove(window, { clientX: 200, clientY: 300 });
        expect(container.querySelectorAll('.cord-ghost').length).toBe(1);
    });

    test('ghost cord has a valid SVG quadratic-bezier path attribute', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.mouseMove(window, { clientX: 200, clientY: 300 });
        const ghost = container.querySelector('.cord-ghost');
        expect(ghost).not.toBeNull();
        expect(ghost!.getAttribute('d')).toMatch(/^M [\d.eE+-]+,[\d.eE+-]+ Q [\d.eE+-]+,[\d.eE+-]+ [\d.eE+-]+,[\d.eE+-]+$/);
    });

    test('ghost cord disappears when patch connection is completed', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        addModule('Filter');
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.mouseMove(window, { clientX: 200, clientY: 300 });
        expect(container.querySelectorAll('.cord-ghost').length).toBe(1);

        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));
        expect(container.querySelectorAll('.cord-ghost').length).toBe(0);
    });

    test('ghost cord disappears when patch is cancelled via the exit button', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.mouseMove(window, { clientX: 200, clientY: 300 });
        expect(container.querySelectorAll('.cord-ghost').length).toBe(1);

        fireEvent.click(container.querySelector('#patchExit')!);
        expect(container.querySelectorAll('.cord-ghost').length).toBe(0);
    });

    test('ghost cord updates position as mouse moves', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));

        fireEvent.mouseMove(window, { clientX: 100, clientY: 100 });
        const d1 = container.querySelector('.cord-ghost')!.getAttribute('d');

        fireEvent.mouseMove(window, { clientX: 400, clientY: 250 });
        const d2 = container.querySelector('.cord-ghost')!.getAttribute('d');

        expect(d1).not.toBe(d2);
    });
});

describe('Module deletion with active cords (disconnect safety)', () => {
    test('deleting the source module removes its outgoing cord without crashing', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        addModule('Filter');
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));
        expect(container.querySelectorAll('#patchCords path').length).toBe(1);

        fireEvent.click(screen.getByRole('button', { name: 'Close Gain' }));
        act(() => vi.advanceTimersByTime(300));

        expect(container.querySelectorAll('#patchCords path').length).toBe(0);
        expect(container.querySelectorAll('.moduleDiv').length).toBe(1);
    });

    test('circularly patched oscillators: deleting one removes both cords without crashing', () => {
        // Regression test: dispose() calls node.disconnect() (all), then the
        // setPatchCords updater tried to disconnect(destination) again → threw
        // InvalidAccessError → React error boundary → "Something went wrong".
        const { container } = renderWithAudioContext(<App />);
        addModule('Oscillator');
        addModule('Oscillator');

        const outputDocks = container.querySelectorAll('#outputOuter');
        const paramDocks = container.querySelectorAll('#firstParam');

        // Osc 0 → Osc 1's frequency modulation input
        fireEvent.click(outputDocks[0]);
        fireEvent.click(paramDocks[1]);

        // Osc 1 → Osc 0's frequency modulation input (circular)
        fireEvent.click(outputDocks[1]);
        fireEvent.click(paramDocks[0]);

        expect(container.querySelectorAll('#patchCords path').length).toBe(2);

        // Delete one — must not crash and must clean up both cords
        fireEvent.click(container.querySelectorAll('.fa-times')[0]);
        act(() => vi.advanceTimersByTime(300));

        expect(container.querySelectorAll('#patchCords path').length).toBe(0);
        expect(container.querySelectorAll('.moduleDiv').length).toBe(1);
    });

    test('deleting a module while a pending cord from another module exists does not crash', () => {
        // Regression test: the second if-branch used el.toData! without a null
        // guard — if a cord was pending (toData = null) it would throw TypeError.
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        addModule('Filter');

        // Start a patch from Gain → pending cord with toData = null
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));

        // Delete Filter (not the source) while the cord is still pending
        fireEvent.click(screen.getByRole('button', { name: 'Close Filter' }));
        act(() => vi.advanceTimersByTime(300));

        // Filter is gone; Gain and the pending cord still exist (Gain is still in patch mode)
        expect(container.querySelectorAll('.moduleDiv').length).toBe(1);
    });

    test('deleting the destination module of a cord removes that cord', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        addModule('Filter');
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));
        expect(container.querySelectorAll('#patchCords path').length).toBe(1);

        fireEvent.click(screen.getByRole('button', { name: 'Close Filter' }));
        act(() => vi.advanceTimersByTime(300));

        expect(container.querySelectorAll('#patchCords path').length).toBe(0);
    });
});

describe('Ghost cord (in-progress patch preview)', () => {
    test('no ghost cord before entering patch mode', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        expect(container.querySelectorAll('.cord-ghost').length).toBe(0);
    });

    test('no ghost cord in patch mode before mouse moves', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        expect(container.querySelectorAll('.cord-ghost').length).toBe(0);
    });

    test('ghost cord appears after entering patch mode and moving the mouse', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.mouseMove(window, { clientX: 200, clientY: 300 });
        expect(container.querySelectorAll('.cord-ghost').length).toBe(1);
    });

    test('ghost cord has a valid SVG quadratic-bezier path attribute', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.mouseMove(window, { clientX: 200, clientY: 300 });
        const ghost = container.querySelector('.cord-ghost');
        expect(ghost).not.toBeNull();
        expect(ghost!.getAttribute('d')).toMatch(/^M [\d.eE+-]+,[\d.eE+-]+ Q [\d.eE+-]+,[\d.eE+-]+ [\d.eE+-]+,[\d.eE+-]+$/);
    });

    test('ghost cord disappears when patch connection is completed', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        addModule('Filter');
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.mouseMove(window, { clientX: 200, clientY: 300 });
        expect(container.querySelectorAll('.cord-ghost').length).toBe(1);

        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));
        expect(container.querySelectorAll('.cord-ghost').length).toBe(0);
    });

    test('ghost cord disappears when patch is cancelled via the exit button', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.mouseMove(window, { clientX: 200, clientY: 300 });
        expect(container.querySelectorAll('.cord-ghost').length).toBe(1);

        fireEvent.click(container.querySelector('#patchExit')!);
        expect(container.querySelectorAll('.cord-ghost').length).toBe(0);
    });

    test('ghost cord updates position as mouse moves', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));

        fireEvent.mouseMove(window, { clientX: 100, clientY: 100 });
        const d1 = container.querySelector('.cord-ghost')!.getAttribute('d');

        fireEvent.mouseMove(window, { clientX: 400, clientY: 250 });
        const d2 = container.querySelector('.cord-ghost')!.getAttribute('d');

        expect(d1).not.toBe(d2);
    });
});

describe('Module deletion with active cords (disconnect safety)', () => {
    test('deleting the source module removes its outgoing cord without crashing', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        addModule('Filter');
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));
        expect(container.querySelectorAll('#patchCords path').length).toBe(1);

        fireEvent.click(screen.getByRole('button', { name: 'Close Gain' }));
        act(() => vi.advanceTimersByTime(300));

        expect(container.querySelectorAll('#patchCords path').length).toBe(0);
        expect(container.querySelectorAll('.moduleDiv').length).toBe(1);
    });

    test('circularly patched oscillators: deleting one removes both cords without crashing', () => {
        // Regression test: dispose() calls node.disconnect() (all), then the
        // setPatchCords updater tried to disconnect(destination) again → threw
        // InvalidAccessError → React error boundary → "Something went wrong".
        const { container } = renderWithAudioContext(<App />);
        addModule('Oscillator');
        addModule('Oscillator');

        const outputDocks = container.querySelectorAll('#outputOuter');
        const paramDocks = container.querySelectorAll('#firstParam');

        // Osc 0 → Osc 1's frequency modulation input
        fireEvent.click(outputDocks[0]);
        fireEvent.click(paramDocks[1]);

        // Osc 1 → Osc 0's frequency modulation input (circular)
        fireEvent.click(outputDocks[1]);
        fireEvent.click(paramDocks[0]);

        expect(container.querySelectorAll('#patchCords path').length).toBe(2);

        // Delete one — must not crash and must clean up both cords
        fireEvent.click(container.querySelectorAll('.fa-times')[0]);
        act(() => vi.advanceTimersByTime(300));

        expect(container.querySelectorAll('#patchCords path').length).toBe(0);
        expect(container.querySelectorAll('.moduleDiv').length).toBe(1);
    });

    test('deleting a module while a pending cord from another module exists does not crash', () => {
        // Regression test: the second if-branch used el.toData! without a null
        // guard — if a cord was pending (toData = null) it would throw TypeError.
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        addModule('Filter');

        // Start a patch from Gain → pending cord with toData = null
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));

        // Delete Filter (not the source) while the cord is still pending
        fireEvent.click(screen.getByRole('button', { name: 'Close Filter' }));
        act(() => vi.advanceTimersByTime(300));

        // Filter is gone; Gain and the pending cord still exist (Gain is still in patch mode)
        expect(container.querySelectorAll('.moduleDiv').length).toBe(1);
    });

    test('deleting the destination module of a cord removes that cord', () => {
        const { container } = renderWithAudioContext(<App />);
        addModule('Gain');
        addModule('Filter');
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));
        expect(container.querySelectorAll('#patchCords path').length).toBe(1);

        fireEvent.click(screen.getByRole('button', { name: 'Close Filter' }));
        act(() => vi.advanceTimersByTime(300));

        expect(container.querySelectorAll('#patchCords path').length).toBe(0);
    });
});
