import { render, screen } from '@testing-library/react';
import { AudioContextProvider, useAudioContext } from '../audio/AudioContextProvider';

function TestConsumer() {
    const ctx = useAudioContext();
    return <div data-testid="result">{ctx ? 'has-context' : 'no-context'}</div>;
}

describe('AudioContextProvider', () => {
    test('provides an AudioContext to children', () => {
        render(
            <AudioContextProvider>
                <TestConsumer />
            </AudioContextProvider>
        );
        expect(screen.getByTestId('result').textContent).toBe('has-context');
    });

    test('useAudioContext throws without provider', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => render(<TestConsumer />)).toThrow('useAudioContext must be used within an AudioContextProvider');
        consoleSpy.mockRestore();
    });

    test('provides same context on re-render', () => {
        const contexts = [];
        function Collector() {
            const ctx = useAudioContext();
            contexts.push(ctx);
            return null;
        }
        const { rerender } = render(
            <AudioContextProvider>
                <Collector />
            </AudioContextProvider>
        );
        rerender(
            <AudioContextProvider>
                <Collector />
            </AudioContextProvider>
        );
        expect(contexts[0]).toBe(contexts[1]);
    });
});
