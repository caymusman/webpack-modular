import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MIDILearnProvider, useMIDILearn } from '../midi/MIDILearnContext';
import type { MIDIMessageHandler } from '../midi/MIDIProvider';
import type { MIDIMapping } from '../types';

// ── Mock MIDIProvider so we can dispatch synthetic MIDI messages ─────────────

const registeredHandlers = new Set<MIDIMessageHandler>();

vi.mock('../midi/MIDIProvider', () => ({
    useMIDI: () => ({
        addHandler: (h: MIDIMessageHandler) => registeredHandlers.add(h),
        removeHandler: (h: MIDIMessageHandler) => registeredHandlers.delete(h),
        midiAvailable: false,
        midiError: null,
    }),
    MIDIProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function fireMIDI(bytes: number[]) {
    const event = { data: new Uint8Array(bytes) } as MIDIMessageEvent;
    registeredHandlers.forEach((h) => h(event));
}

afterEach(() => {
    registeredHandlers.clear();
});

// ── Test consumer component ──────────────────────────────────────────────────

function TestConsumer({ checkId = 'Oscillator 0::frequency' }: { checkId?: string }) {
    const { learnMode, armedControl, armControl, isMapped, toggleLearnMode, serializeMappings } =
        useMIDILearn();

    return (
        <div>
            <span data-testid="learnMode">{String(learnMode)}</span>
            <span data-testid="armed">{armedControl?.midiLearnId ?? 'none'}</span>
            <span data-testid="isGate">{String(armedControl?.isGate ?? false)}</span>
            <span data-testid="mapped">{String(isMapped(checkId))}</span>
            <span data-testid="mappingCount">{serializeMappings().length}</span>
            <button onClick={toggleLearnMode}>toggle</button>
            <button onClick={() => armControl('Oscillator 0::frequency')}>arm-freq</button>
            <button onClick={() => armControl('ADSR 0::gate', true)}>arm-gate</button>
            <button onClick={() => armControl('Filter 0::frequency')}>arm-filter</button>
        </div>
    );
}

function renderConsumer(checkId?: string) {
    return render(
        <MIDILearnProvider>
            <TestConsumer checkId={checkId} />
        </MIDILearnProvider>
    );
}

// ── toggleLearnMode ──────────────────────────────────────────────────────────

describe('toggleLearnMode', () => {
    test('starts as false', () => {
        renderConsumer();
        expect(screen.getByTestId('learnMode').textContent).toBe('false');
    });

    test('clicking toggle enters learn mode', () => {
        renderConsumer();
        fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
        expect(screen.getByTestId('learnMode').textContent).toBe('true');
    });

    test('clicking toggle twice exits learn mode', () => {
        renderConsumer();
        fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
        fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
        expect(screen.getByTestId('learnMode').textContent).toBe('false');
    });

    test('exiting learn mode clears the armed control', () => {
        renderConsumer();
        fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
        fireEvent.click(screen.getByRole('button', { name: 'arm-freq' }));
        expect(screen.getByTestId('armed').textContent).toBe('Oscillator 0::frequency');

        fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
        expect(screen.getByTestId('armed').textContent).toBe('none');
    });
});

// ── armControl ───────────────────────────────────────────────────────────────

describe('armControl', () => {
    test('sets armed control midiLearnId', () => {
        renderConsumer();
        fireEvent.click(screen.getByRole('button', { name: 'arm-freq' }));
        expect(screen.getByTestId('armed').textContent).toBe('Oscillator 0::frequency');
    });

    test('isGate defaults to false', () => {
        renderConsumer();
        fireEvent.click(screen.getByRole('button', { name: 'arm-freq' }));
        expect(screen.getByTestId('isGate').textContent).toBe('false');
    });

    test('isGate is true when arm-gate is clicked', () => {
        renderConsumer();
        fireEvent.click(screen.getByRole('button', { name: 'arm-gate' }));
        expect(screen.getByTestId('armed').textContent).toBe('ADSR 0::gate');
        expect(screen.getByTestId('isGate').textContent).toBe('true');
    });

    test('arming a different control replaces the previous one', () => {
        renderConsumer();
        fireEvent.click(screen.getByRole('button', { name: 'arm-freq' }));
        fireEvent.click(screen.getByRole('button', { name: 'arm-filter' }));
        expect(screen.getByTestId('armed').textContent).toBe('Filter 0::frequency');
    });
});

// ── Escape key ───────────────────────────────────────────────────────────────

describe('Escape key exits learn mode', () => {
    test('Escape exits learn mode', () => {
        renderConsumer();
        fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
        expect(screen.getByTestId('learnMode').textContent).toBe('true');

        fireEvent.keyDown(window, { key: 'Escape' });
        expect(screen.getByTestId('learnMode').textContent).toBe('false');
    });

    test('Escape clears armed control', () => {
        renderConsumer();
        fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
        fireEvent.click(screen.getByRole('button', { name: 'arm-freq' }));
        expect(screen.getByTestId('armed').textContent).toBe('Oscillator 0::frequency');

        fireEvent.keyDown(window, { key: 'Escape' });
        expect(screen.getByTestId('armed').textContent).toBe('none');
    });

    test('Escape when NOT in learn mode is a no-op', () => {
        renderConsumer();
        expect(screen.getByTestId('learnMode').textContent).toBe('false');
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(screen.getByTestId('learnMode').textContent).toBe('false');
    });
});

// ── CC mapping capture ────────────────────────────────────────────────────────

describe('CC MIDI message while armed', () => {
    test('creates a CC mapping and clears armed control', async () => {
        renderConsumer('Oscillator 0::frequency');
        fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
        fireEvent.click(screen.getByRole('button', { name: 'arm-freq' }));

        // CC message: status=0xB0 (ch0 CC), cc=7, value=64
        await act(async () => { fireMIDI([0xb0, 7, 64]); });

        expect(screen.getByTestId('armed').textContent).toBe('none');
        await waitFor(() => {
            expect(screen.getByTestId('mapped').textContent).toBe('true');
        });
        expect(screen.getByTestId('mappingCount').textContent).toBe('1');
    });

    test('no mapping created if NOT armed', async () => {
        renderConsumer('Oscillator 0::frequency');
        fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
        // learn mode on but no control armed

        await act(async () => { fireMIDI([0xb0, 7, 64]); });

        expect(screen.getByTestId('mappingCount').textContent).toBe('0');
    });

    test('no mapping created when NOT in learn mode', async () => {
        renderConsumer('Oscillator 0::frequency');
        // learn mode is off
        fireEvent.click(screen.getByRole('button', { name: 'arm-freq' })); // arm with no learn mode

        await act(async () => { fireMIDI([0xb0, 7, 64]); });

        expect(screen.getByTestId('mappingCount').textContent).toBe('0');
    });

    test('created mapping has correct kind, channel, cc, moduleKey, paramKey', async () => {
        let captured: MIDIMapping[] = [];
        function Inspector() {
            const { serializeMappings } = useMIDILearn();
            captured = serializeMappings();
            return null;
        }
        render(
            <MIDILearnProvider>
                <TestConsumer />
                <Inspector />
            </MIDILearnProvider>
        );

        fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
        fireEvent.click(screen.getByRole('button', { name: 'arm-freq' }));

        // channel 2, CC 74
        await act(async () => { fireMIDI([0xb2, 74, 100]); });

        await waitFor(() => { expect(captured.length).toBe(1); });
        const m = captured[0];
        expect(m.kind).toBe('cc');
        if (m.kind === 'cc') {
            expect(m.channel).toBe(2);
            expect(m.cc).toBe(74);
            expect(m.moduleKey).toBe('Oscillator 0');
            expect(m.paramKey).toBe('frequency');
        }
    });
});

// ── Note mapping capture ──────────────────────────────────────────────────────

describe('Note-on MIDI message while armed (non-gate)', () => {
    test('creates a note mapping and clears armed', async () => {
        renderConsumer('Oscillator 0::frequency');
        fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
        fireEvent.click(screen.getByRole('button', { name: 'arm-freq' }));

        // Note-on: status=0x90 (ch0), note=60, velocity=100
        await act(async () => { fireMIDI([0x90, 60, 100]); });

        expect(screen.getByTestId('armed').textContent).toBe('none');
        await waitFor(() => {
            expect(screen.getByTestId('mapped').textContent).toBe('true');
        });
    });

    test('note mapping has kind=note and correct fields', async () => {
        let captured: MIDIMapping[] = [];
        function Inspector() {
            const { serializeMappings } = useMIDILearn();
            captured = serializeMappings();
            return null;
        }
        render(
            <MIDILearnProvider>
                <TestConsumer />
                <Inspector />
            </MIDILearnProvider>
        );

        fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
        fireEvent.click(screen.getByRole('button', { name: 'arm-freq' }));

        await act(async () => { fireMIDI([0x91, 48, 80]); }); // channel 1

        await waitFor(() => { expect(captured.length).toBe(1); });
        const m = captured[0];
        expect(m.kind).toBe('note');
        if (m.kind === 'note') {
            expect(m.channel).toBe(1);
            expect(m.moduleKey).toBe('Oscillator 0');
            expect(m.paramKey).toBe('frequency');
        }
    });

    test('note-off (velocity 0) does NOT create a mapping', async () => {
        renderConsumer('Oscillator 0::frequency');
        fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
        fireEvent.click(screen.getByRole('button', { name: 'arm-freq' }));

        // Note-on with velocity 0 = note-off convention
        await act(async () => { fireMIDI([0x90, 60, 0]); });

        expect(screen.getByTestId('mappingCount').textContent).toBe('0');
        expect(screen.getByTestId('armed').textContent).toBe('Oscillator 0::frequency');
    });
});

// ── Gate mapping capture ──────────────────────────────────────────────────────

describe('Note-on MIDI message while armed as gate', () => {
    test('creates a gate mapping', async () => {
        renderConsumer('ADSR 0::gate');
        fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
        fireEvent.click(screen.getByRole('button', { name: 'arm-gate' }));

        await act(async () => { fireMIDI([0x90, 60, 100]); });

        expect(screen.getByTestId('armed').textContent).toBe('none');
        await waitFor(() => {
            expect(screen.getByTestId('mapped').textContent).toBe('true');
        });
    });

    test('gate mapping has kind=gate and correct fields', async () => {
        let captured: MIDIMapping[] = [];
        function Inspector() {
            const { serializeMappings } = useMIDILearn();
            captured = serializeMappings();
            return null;
        }
        render(
            <MIDILearnProvider>
                <TestConsumer checkId="ADSR 0::gate" />
                <Inspector />
            </MIDILearnProvider>
        );

        fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
        fireEvent.click(screen.getByRole('button', { name: 'arm-gate' }));

        await act(async () => { fireMIDI([0x92, 60, 100]); }); // channel 2

        await waitFor(() => { expect(captured.length).toBe(1); });
        const m = captured[0];
        expect(m.kind).toBe('gate');
        if (m.kind === 'gate') {
            expect(m.channel).toBe(2);
            expect(m.moduleKey).toBe('ADSR 0');
        }
    });
});

// ── loadMappings / serializeMappings ──────────────────────────────────────────

describe('loadMappings', () => {
    function LoadTester({ mappings }: { mappings: MIDIMapping[] }) {
        const { loadMappings, isMapped, serializeMappings } = useMIDILearn();
        return (
            <div>
                <span data-testid="freqMapped">{String(isMapped('Oscillator 0::frequency'))}</span>
                <span data-testid="panMapped">{String(isMapped('Panner 0::pan'))}</span>
                <span data-testid="count">{serializeMappings().length}</span>
                <button onClick={() => loadMappings(mappings)}>load</button>
            </div>
        );
    }

    test('loadMappings restores CC mappings and isMapped returns true', async () => {
        const mappings: MIDIMapping[] = [
            { kind: 'cc', channel: 0, cc: 7, moduleKey: 'Oscillator 0', paramKey: 'frequency', min: 20, max: 20000 },
        ];
        render(
            <MIDILearnProvider>
                <LoadTester mappings={mappings} />
            </MIDILearnProvider>
        );

        expect(screen.getByTestId('freqMapped').textContent).toBe('false');
        fireEvent.click(screen.getByRole('button', { name: 'load' }));
        await waitFor(() => {
            expect(screen.getByTestId('freqMapped').textContent).toBe('true');
        });
        expect(screen.getByTestId('count').textContent).toBe('1');
    });

    test('loadMappings restores note mappings', async () => {
        const mappings: MIDIMapping[] = [
            { kind: 'note', channel: 0, moduleKey: 'Oscillator 0', paramKey: 'frequency' },
        ];
        render(
            <MIDILearnProvider>
                <LoadTester mappings={mappings} />
            </MIDILearnProvider>
        );

        fireEvent.click(screen.getByRole('button', { name: 'load' }));
        await waitFor(() => {
            expect(screen.getByTestId('freqMapped').textContent).toBe('true');
        });
    });

    test('loadMappings restores gate mappings', async () => {
        const mappings: MIDIMapping[] = [
            { kind: 'gate', channel: 0, moduleKey: 'ADSR 0' },
        ];
        function GateTester() {
            const { loadMappings, isMapped } = useMIDILearn();
            return (
                <div>
                    <span data-testid="gateMapped">{String(isMapped('ADSR 0::gate'))}</span>
                    <button onClick={() => loadMappings(mappings)}>load</button>
                </div>
            );
        }
        render(<MIDILearnProvider><GateTester /></MIDILearnProvider>);
        fireEvent.click(screen.getByRole('button', { name: 'load' }));
        await waitFor(() => {
            expect(screen.getByTestId('gateMapped').textContent).toBe('true');
        });
    });

    test('loadMappings with empty array clears existing mappings', async () => {
        const mappings: MIDIMapping[] = [
            { kind: 'cc', channel: 0, cc: 7, moduleKey: 'Oscillator 0', paramKey: 'frequency', min: 0, max: 1 },
        ];
        function ClearTester() {
            const { loadMappings, serializeMappings } = useMIDILearn();
            return (
                <div>
                    <span data-testid="count">{serializeMappings().length}</span>
                    <button onClick={() => loadMappings(mappings)}>load</button>
                    <button onClick={() => loadMappings([])}>clear</button>
                </div>
            );
        }
        render(<MIDILearnProvider><ClearTester /></MIDILearnProvider>);
        fireEvent.click(screen.getByRole('button', { name: 'load' }));
        await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('1'));
        fireEvent.click(screen.getByRole('button', { name: 'clear' }));
        await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('0'));
    });

    test('serializeMappings returns same mappings that were loaded', async () => {
        const mappings: MIDIMapping[] = [
            { kind: 'cc', channel: 1, cc: 11, moduleKey: 'Filter 0', paramKey: 'frequency', min: 200, max: 8000 },
            { kind: 'note', channel: 0, moduleKey: 'Oscillator 0', paramKey: 'frequency' },
        ];
        let serialized: MIDIMapping[] = [];
        function Spy() {
            const { loadMappings, serializeMappings } = useMIDILearn();
            serialized = serializeMappings();
            return <button onClick={() => loadMappings(mappings)}>load</button>;
        }
        render(<MIDILearnProvider><Spy /></MIDILearnProvider>);
        fireEvent.click(screen.getByRole('button', { name: 'load' }));
        await waitFor(() => expect(serialized.length).toBe(2));
        expect(serialized).toEqual(expect.arrayContaining(mappings));
    });
});

// ── isMapped ─────────────────────────────────────────────────────────────────

describe('isMapped', () => {
    test('returns false for an unmapped control', () => {
        renderConsumer('Oscillator 0::frequency');
        expect(screen.getByTestId('mapped').textContent).toBe('false');
    });

    test('returns true after a CC mapping is captured', async () => {
        renderConsumer('Oscillator 0::frequency');
        fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
        fireEvent.click(screen.getByRole('button', { name: 'arm-freq' }));
        await act(async () => { fireMIDI([0xb0, 1, 100]); });
        await waitFor(() => {
            expect(screen.getByTestId('mapped').textContent).toBe('true');
        });
    });

    test('returns false for a different control not mapped', async () => {
        renderConsumer('Filter 0::gain'); // checking a different id
        fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
        fireEvent.click(screen.getByRole('button', { name: 'arm-freq' })); // arm oscillator freq
        await act(async () => { fireMIDI([0xb0, 1, 100]); });
        // filter gain was not mapped
        await waitFor(() => {
            expect(screen.getByTestId('mapped').textContent).toBe('false');
        });
    });
});
