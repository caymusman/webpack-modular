import { render, screen, fireEvent } from '@testing-library/react';
import ModulePalette from '../components/ModulePalette';

function renderPalette(props: Partial<Parameters<typeof ModulePalette>[0]> = {}) {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(
        <ModulePalette
            onAdd={onAdd}
            onClose={onClose}
            audioIn={false}
            {...props}
        />
    );
    return { onAdd, onClose };
}

describe('ModulePalette', () => {
    test('renders all modules when query is empty', () => {
        renderPalette();
        const items = screen.getAllByRole('option');
        expect(items.length).toBe(14);
        expect(screen.getByText('Oscillator')).toBeTruthy();
        expect(screen.getByText('Gain')).toBeTruthy();
        expect(screen.getByText('Recorder')).toBeTruthy();
    });

    test('filters results when query is typed', () => {
        renderPalette();
        const input = screen.getByLabelText('Search modules');
        fireEvent.change(input, { target: { value: 'os' } });
        const items = screen.getAllByRole('option');
        // "Oscillator" matches "os"
        expect(items.length).toBe(1);
        expect(screen.getByText('Oscillator')).toBeTruthy();
    });

    test('shows No results when nothing matches', () => {
        renderPalette();
        const input = screen.getByLabelText('Search modules');
        fireEvent.change(input, { target: { value: 'zzz' } });
        expect(screen.getByText('No results')).toBeTruthy();
        expect(screen.queryAllByRole('option').length).toBe(0);
    });

    test('calls onAdd and onClose when item is clicked', () => {
        const { onAdd, onClose } = renderPalette();
        fireEvent.click(screen.getByText('Gain'));
        expect(onAdd).toHaveBeenCalledWith('Gain', false);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('AudioInput item is disabled when audioIn is true', () => {
        const { onAdd } = renderPalette({ audioIn: true });
        const audioInputItem = screen.getByText('AudioInput');
        expect(audioInputItem.closest('li')?.getAttribute('aria-disabled')).toBe('true');
        fireEvent.click(audioInputItem);
        expect(onAdd).not.toHaveBeenCalled();
    });

    test('Escape keydown calls onClose', () => {
        const { onClose } = renderPalette();
        const input = screen.getByLabelText('Search modules');
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('Enter keydown calls onAdd for the active item', () => {
        const { onAdd, onClose } = renderPalette();
        const input = screen.getByLabelText('Search modules');
        // First item (Oscillator) is active by default
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(onAdd).toHaveBeenCalledWith('Oscillator', true);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('ArrowDown moves active index down', () => {
        renderPalette();
        const input = screen.getByLabelText('Search modules');
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        // Second item (Gain) should now be active
        const gainItem = screen.getByText('Gain').closest('li');
        expect(gainItem?.classList.contains('modulePalette__item--active')).toBe(true);
    });

    test('ArrowUp moves active index up but not below 0', () => {
        renderPalette();
        const input = screen.getByLabelText('Search modules');
        // Press up from index 0 — should stay at 0
        fireEvent.keyDown(input, { key: 'ArrowUp' });
        const oscItem = screen.getByText('Oscillator').closest('li');
        expect(oscItem?.classList.contains('modulePalette__item--active')).toBe(true);
    });

    test('Enter does not call onAdd for disabled AudioInput', () => {
        const { onAdd } = renderPalette({ audioIn: true });
        const input = screen.getByLabelText('Search modules');
        // Filter to AudioInput only
        fireEvent.change(input, { target: { value: 'AudioInput' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(onAdd).not.toHaveBeenCalled();
    });
});
