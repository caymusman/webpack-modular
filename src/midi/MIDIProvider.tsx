import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';

export type MIDIMessageHandler = (event: MIDIMessageEvent) => void;

interface MIDIContextValue {
    addHandler: (handler: MIDIMessageHandler) => void;
    removeHandler: (handler: MIDIMessageHandler) => void;
    midiAvailable: boolean;
    midiError: string | null;
}

const MIDIContext = createContext<MIDIContextValue | null>(null);

interface MIDIProviderProps {
    children: ReactNode;
}

export function MIDIProvider({ children }: MIDIProviderProps) {
    const handlers = useRef<Set<MIDIMessageHandler>>(new Set());
    const [midiAvailable, setMidiAvailable] = useState(false);
    const [midiError, setMidiError] = useState<string | null>(null);
    const midiAccessRef = useRef<MIDIAccess | null>(null);

    const dispatch = (event: MIDIMessageEvent) => {
        handlers.current.forEach((h) => h(event));
    };

    const subscribeInput = (input: MIDIInput) => {
        input.onmidimessage = dispatch;
    };

    const unsubscribeInput = (input: MIDIInput) => {
        input.onmidimessage = null;
    };

    useEffect(() => {
        if (!navigator.requestMIDIAccess) {
            setMidiError('Web MIDI API not supported in this browser.');
            return;
        }

        let cancelled = false;

        navigator.requestMIDIAccess().then(
            (access) => {
                if (cancelled) return;
                midiAccessRef.current = access;
                setMidiAvailable(true);

                // Subscribe all currently connected inputs
                access.inputs.forEach((input) => subscribeInput(input));

                // Handle hot-plug
                access.onstatechange = (event: MIDIConnectionEvent) => {
                    const port = event.port;
                    if (!port) return;
                    if (port.type === 'input') {
                        if (port.state === 'connected') {
                            subscribeInput(port as MIDIInput);
                        } else {
                            unsubscribeInput(port as MIDIInput);
                        }
                    }
                };
            },
            (err: unknown) => {
                if (cancelled) return;
                setMidiError(err instanceof Error ? err.message : 'MIDI access denied.');
            }
        );

        return () => {
            cancelled = true;
            if (midiAccessRef.current) {
                midiAccessRef.current.inputs.forEach((input) => unsubscribeInput(input));
                midiAccessRef.current.onstatechange = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addHandler = (handler: MIDIMessageHandler) => {
        handlers.current.add(handler);
    };

    const removeHandler = (handler: MIDIMessageHandler) => {
        handlers.current.delete(handler);
    };

    return (
        <MIDIContext.Provider value={{ addHandler, removeHandler, midiAvailable, midiError }}>
            {children}
        </MIDIContext.Provider>
    );
}

export function useMIDI(): MIDIContextValue {
    const ctx = useContext(MIDIContext);
    if (!ctx) {
        throw new Error('useMIDI must be used within a MIDIProvider');
    }
    return ctx;
}
