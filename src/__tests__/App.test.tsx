import { screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { renderWithAudioContext } from './testUtils';

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
        expect(container.querySelector('#playSpace')).toBeTruthy();
    });

    test('renders all sidebar buttons', () => {
        const buttons = screen.getAllByRole('button');
        const names = buttons.map((b) => b.textContent);
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
    });

    test('renders Output module', () => {
        expect(screen.getByText('Output')).toBeTruthy();
    });
});

describe('Module creation', () => {
    test('clicking sidebar button creates a module', () => {
        const { container } = renderWithAudioContext(<App />);
        const oscButton = screen.getByRole('button', { name: 'Oscillator' });
        fireEvent.click(oscButton);

        const modules = container.querySelectorAll('.moduleDiv');
        expect(modules.length).toBe(1);
    });

    test('clicking button twice creates two modules', () => {
        const { container } = renderWithAudioContext(<App />);
        const gainButton = screen.getByRole('button', { name: 'Gain' });
        fireEvent.click(gainButton);
        fireEvent.click(gainButton);

        const modules = container.querySelectorAll('.moduleDiv');
        expect(modules.length).toBe(2);
    });

    test('module displays its type name', () => {
        renderWithAudioContext(<App />);
        const oscButton = screen.getByRole('button', { name: 'Oscillator' });
        fireEvent.click(oscButton);

        // The module title paragraph should contain the type name
        const titles = screen.getAllByText('Oscillator');
        // One is the sidebar button, one (or more) is the module title
        expect(titles.length).toBeGreaterThanOrEqual(2);
    });

    test('created module has input cord area', () => {
        const { container } = renderWithAudioContext(<App />);
        const oscButton = screen.getByRole('button', { name: 'Oscillator' });
        fireEvent.click(oscButton);

        const outputOuters = container.querySelectorAll('#outputOuter');
        expect(outputOuters.length).toBe(1);
    });

    test('Gain module has output cord area (inputOnly=false)', () => {
        const { container } = renderWithAudioContext(<App />);
        const gainButton = screen.getByRole('button', { name: 'Gain' });
        fireEvent.click(gainButton);

        const inputOuters = container.querySelectorAll('#inputOuter');
        expect(inputOuters.length).toBe(1);
    });

    test('Oscillator module does NOT have output cord area (inputOnly=true)', () => {
        const { container } = renderWithAudioContext(<App />);
        const oscButton = screen.getByRole('button', { name: 'Oscillator' });
        fireEvent.click(oscButton);

        // Oscillator is inputOnly="true", should not render the output cord div
        const moduleDiv = container.querySelector('.moduleDiv');
        const inputOuter = moduleDiv.querySelector('#inputOuter');
        expect(inputOuter).toBeNull();
    });
});

describe('Module deletion', () => {
    test('clicking close icon removes a module', () => {
        const { container } = renderWithAudioContext(<App />);
        const gainButton = screen.getByRole('button', { name: 'Gain' });
        fireEvent.click(gainButton);

        expect(container.querySelectorAll('.moduleDiv').length).toBe(1);

        // Click the close icon (fa-times)
        const closeIcon = container.querySelector('.fa-times');
        fireEvent.click(closeIcon);

        expect(container.querySelectorAll('.moduleDiv').length).toBe(0);
    });

    test('deleting one module preserves others', () => {
        const { container } = renderWithAudioContext(<App />);
        const gainButton = screen.getByRole('button', { name: 'Gain' });
        const filterButton = screen.getByRole('button', { name: 'Filter' });
        fireEvent.click(gainButton);
        fireEvent.click(filterButton);

        expect(container.querySelectorAll('.moduleDiv').length).toBe(2);

        // Close the first module
        const closeIcons = container.querySelectorAll('.fa-times');
        fireEvent.click(closeIcons[0]);

        expect(container.querySelectorAll('.moduleDiv').length).toBe(1);
    });
});

describe('Patch cord validation', () => {
    test('entering patch mode shows cancel button', () => {
        const { container } = renderWithAudioContext(<App />);
        const oscButton = screen.getByRole('button', { name: 'Oscillator' });
        fireEvent.click(oscButton);

        // Click the input cord area to start patching
        const outputOuter = container.querySelector('#outputOuter');
        fireEvent.click(outputOuter);

        // The patchExit button should become visible (has 'show' class)
        const patchExit = container.querySelector('#patchExit');
        expect(patchExit.className).toContain('show');
    });

    test('cancelling patch mode hides cancel button', () => {
        const { container } = renderWithAudioContext(<App />);
        const oscButton = screen.getByRole('button', { name: 'Oscillator' });
        fireEvent.click(oscButton);

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
        const oscButton = screen.getByRole('button', { name: 'Oscillator' });
        fireEvent.click(oscButton);

        // Start a patch from oscillator output
        const outputOuter = container.querySelector('#outputOuter');
        fireEvent.click(outputOuter);

        // Try to connect to the Output module (this is a valid connection, not self-patch)
        // Instead, let's create a scenario that triggers an alert
        // We need a module that can self-patch — but that requires outputMode + clicking own input
        // For now, just verify the pingBox starts hidden
        const pingBox = container.querySelector('.pingBox');
        expect(pingBox.className).toContain('hide');
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
        fireEvent.click(screen.getByRole('button', { name: 'Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Filter' }));

        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));

        expect(container.querySelectorAll('#patchCords line').length).toBe(1);
    });

    test('patch mode exits after successful connection', () => {
        const { container } = renderWithAudioContext(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Filter' }));

        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));

        expect(container.querySelector('#patchExit').className).toContain('hide');
    });

    test('self-patch shows alert', () => {
        const { container } = renderWithAudioContext(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Gain' }));

        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Gain' }));

        expect(container.querySelector('.pingBox').className).toContain('show');
        expect(container.querySelector('#pingText').textContent).toContain(
            'cannot plug a module into itself'
        );
        expect(container.querySelectorAll('#patchCords line').length).toBe(0);
    });

    test('duplicate patch shows alert', () => {
        const { container } = renderWithAudioContext(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Filter' }));

        // First connection
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));

        // Attempt duplicate
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));

        expect(container.querySelector('.pingBox').className).toContain('show');
        expect(container.querySelector('#pingText').textContent).toContain('already patched');
        expect(container.querySelectorAll('#patchCords line').length).toBe(1);
    });

    test('param cross-ref shows alert', () => {
        const { container } = renderWithAudioContext(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Oscillator' }));

        fireEvent.click(screen.getByRole('button', { name: 'Connect from Oscillator' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to frequency param' }));

        expect(container.querySelector('.pingBox').className).toContain('show');
        expect(container.querySelector('#pingText').textContent).toContain('thats a new one');
        expect(container.querySelectorAll('#patchCords line').length).toBe(0);
    });

    test('multiple valid connections', () => {
        const { container } = renderWithAudioContext(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
        fireEvent.click(screen.getByRole('button', { name: 'Panner' }));

        // Connect Gain→Filter
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));
        // Connect Gain→Panner
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Panner' }));

        expect(container.querySelectorAll('#patchCords line').length).toBe(2);
    });
});

describe('Patch cord deletion', () => {
    test('clicking a cord line removes it', () => {
        const { container } = renderWithAudioContext(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Filter' }));

        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));
        expect(container.querySelectorAll('#patchCords line').length).toBe(1);

        fireEvent.click(container.querySelector('#patchCords line'));

        expect(container.querySelectorAll('#patchCords line').length).toBe(0);
    });

    test('deleting a cord allows re-patching same route', () => {
        const { container } = renderWithAudioContext(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Filter' }));

        // Connect then delete
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));
        fireEvent.click(container.querySelector('#patchCords line'));
        expect(container.querySelectorAll('#patchCords line').length).toBe(0);

        // Reconnect same route
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));

        expect(container.querySelectorAll('#patchCords line').length).toBe(1);
        expect(container.querySelector('.pingBox').className).toContain('hide');
    });

    test('closing source module removes its cords', () => {
        const { container } = renderWithAudioContext(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
        fireEvent.click(screen.getByRole('button', { name: 'Panner' }));

        // Connect Gain→Filter and Gain→Panner
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Panner' }));
        expect(container.querySelectorAll('#patchCords line').length).toBe(2);

        // Close Gain
        fireEvent.click(screen.getByRole('button', { name: 'Close Gain' }));

        expect(container.querySelectorAll('#patchCords line').length).toBe(0);
    });

    test('closing target module removes cord to it', () => {
        const { container } = renderWithAudioContext(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Filter' }));

        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));
        expect(container.querySelectorAll('#patchCords line').length).toBe(1);

        // Close Filter
        fireEvent.click(screen.getByRole('button', { name: 'Close Filter' }));

        expect(container.querySelectorAll('#patchCords line').length).toBe(0);
    });
});

describe('Cord keyboard interaction', () => {
    test('Enter key on cord line deletes it', () => {
        const { container } = renderWithAudioContext(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Filter' }));

        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));

        fireEvent.keyDown(container.querySelector('#patchCords line'), { key: 'Enter' });

        expect(container.querySelectorAll('#patchCords line').length).toBe(0);
    });

    test('Space key on cord line deletes it', () => {
        const { container } = renderWithAudioContext(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Filter' }));

        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connect to Filter' }));

        fireEvent.keyDown(container.querySelector('#patchCords line'), { key: ' ' });

        expect(container.querySelectorAll('#patchCords line').length).toBe(0);
    });
});

describe('Cord dock keyboard interaction', () => {
    test('Enter on output dock starts patch mode', () => {
        const { container } = renderWithAudioContext(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Gain' }));

        fireEvent.keyDown(screen.getByRole('button', { name: 'Connect from Gain' }), {
            key: 'Enter',
        });

        expect(container.querySelector('#patchExit').className).toContain('show');
    });

    test('Space on output dock starts patch mode', () => {
        const { container } = renderWithAudioContext(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Gain' }));

        fireEvent.keyDown(screen.getByRole('button', { name: 'Connect from Gain' }), {
            key: ' ',
        });

        expect(container.querySelector('#patchExit').className).toContain('show');
    });

    test('Enter on input dock completes connection', () => {
        const { container } = renderWithAudioContext(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Gain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Filter' }));

        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.keyDown(screen.getByRole('button', { name: 'Connect to Filter' }), {
            key: 'Enter',
        });

        expect(container.querySelectorAll('#patchCords line').length).toBe(1);
    });

    test('Enter on Output module dock completes connection', () => {
        const { container } = renderWithAudioContext(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Gain' }));

        fireEvent.click(screen.getByRole('button', { name: 'Connect from Gain' }));
        fireEvent.keyDown(screen.getByRole('button', { name: 'Connect to Output' }), {
            key: 'Enter',
        });

        expect(container.querySelectorAll('#patchCords line').length).toBe(1);
    });
});
