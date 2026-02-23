import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { MIDIMapping, MIDICCMapping, MIDINoteMapping, MIDIGateMapping } from '../types';
import { useMIDI, MIDIMessageHandler } from './MIDIProvider';
import { makeMIDIMappingKey, makeMIDINoteKey, parseMIDILearnId } from './midiUtils';

interface ArmedControl {
    midiLearnId: string;
    isGate: boolean;
}

interface MIDILearnContextValue {
    learnMode: boolean;
    toggleLearnMode: () => void;
    armedControl: ArmedControl | null;
    armControl: (midiLearnId: string, isGate?: boolean) => void;
    isMapped: (midiLearnId: string) => boolean;
    loadMappings: (mappings: MIDIMapping[]) => void;
    serializeMappings: () => MIDIMapping[];
}

const MIDILearnContext = createContext<MIDILearnContextValue | null>(null);

interface MIDILearnProviderProps {
    children: ReactNode;
}

export function MIDILearnProvider({ children }: MIDILearnProviderProps) {
    const [learnMode, setLearnMode] = useState(false);
    const [armedControl, setArmedControl] = useState<ArmedControl | null>(null);
    // Map from stable key (e.g. "cc:0:7") to MIDIMapping
    const [mappings, setMappings] = useState<Map<string, MIDIMapping>>(new Map());
    // Also maintain a set of midiLearnIds that are mapped, for quick isMapped lookup
    const mappedIds = useRef<Set<string>>(new Set());

    const { addHandler, removeHandler } = useMIDI();

    const toggleLearnMode = useCallback(() => {
        setLearnMode((prev) => {
            if (prev) {
                setArmedControl(null);
            }
            return !prev;
        });
    }, []);

    // Exit learn mode on Escape
    useEffect(() => {
        if (!learnMode) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setLearnMode(false);
                setArmedControl(null);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [learnMode]);

    const armControl = useCallback((midiLearnId: string, isGate = false) => {
        setArmedControl({ midiLearnId, isGate });
    }, []);

    const isMapped = useCallback(
        (midiLearnId: string): boolean => {
            return mappedIds.current.has(midiLearnId);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [mappings]
    );

    const loadMappings = useCallback((incoming: MIDIMapping[]) => {
        const newMap = new Map<string, MIDIMapping>();
        const newIds = new Set<string>();
        for (const m of incoming) {
            let key: string;
            if (m.kind === 'cc') {
                key = makeMIDIMappingKey(m.channel, m.cc);
                newIds.add(`${m.moduleKey}::${m.paramKey}`);
            } else if (m.kind === 'note') {
                key = makeMIDINoteKey(m.channel);
                newIds.add(`${m.moduleKey}::${m.paramKey}`);
            } else {
                key = `gate:${m.channel}:${m.moduleKey}`;
                newIds.add(`${m.moduleKey}::gate`);
            }
            newMap.set(key, m);
        }
        mappedIds.current = newIds;
        setMappings(newMap);
    }, []);

    const serializeMappings = useCallback((): MIDIMapping[] => {
        return Array.from(mappings.values());
    }, [mappings]);

    // MIDI learn capture handler
    const armedRef = useRef(armedControl);
    const learnModeRef = useRef(learnMode);
    useEffect(() => {
        armedRef.current = armedControl;
    }, [armedControl]);
    useEffect(() => {
        learnModeRef.current = learnMode;
    }, [learnMode]);

    const learnHandler = useCallback<MIDIMessageHandler>(
        (event) => {
            if (!learnModeRef.current || !armedRef.current) return;
            const data = event.data;
            if (!data || data.length < 2) return;

            const status = data[0];
            const channel = status & 0x0f;
            const type = status & 0xf0;
            const armed = armedRef.current;

            if (type === 0xb0) {
                // CC message
                const cc = data[1];
                const { moduleKey, paramKey } = parseMIDILearnId(armed.midiLearnId);
                if (!moduleKey || !paramKey) return;

                const mapping: MIDICCMapping = {
                    kind: 'cc',
                    channel,
                    cc,
                    moduleKey,
                    paramKey,
                    min: 0,
                    max: 1,
                };
                const key = makeMIDIMappingKey(channel, cc);
                setMappings((prev) => {
                    const next = new Map(prev);
                    next.set(key, mapping);
                    return next;
                });
                mappedIds.current = new Set([...mappedIds.current, armed.midiLearnId]);
                setArmedControl(null);
            } else if (type === 0x90 && data.length >= 3 && data[2] > 0) {
                // Note-on message
                const { moduleKey, paramKey } = parseMIDILearnId(armed.midiLearnId);
                if (!moduleKey) return;

                if (armed.isGate) {
                    const mapping: MIDIGateMapping = { kind: 'gate', channel, moduleKey };
                    const key = `gate:${channel}:${moduleKey}`;
                    setMappings((prev) => {
                        const next = new Map(prev);
                        next.set(key, mapping);
                        return next;
                    });
                    mappedIds.current = new Set([...mappedIds.current, armed.midiLearnId]);
                } else {
                    const mapping: MIDINoteMapping = {
                        kind: 'note',
                        channel,
                        moduleKey,
                        paramKey: 'frequency',
                    };
                    const key = makeMIDINoteKey(channel);
                    setMappings((prev) => {
                        const next = new Map(prev);
                        next.set(key, mapping);
                        return next;
                    });
                    mappedIds.current = new Set([...mappedIds.current, `${moduleKey}::${paramKey}`]);
                }
                setArmedControl(null);
            }
        },
        []
    );

    useEffect(() => {
        addHandler(learnHandler);
        return () => removeHandler(learnHandler);
    }, [addHandler, removeHandler, learnHandler]);

    return (
        <MIDILearnContext.Provider
            value={{ learnMode, toggleLearnMode, armedControl, armControl, isMapped, loadMappings, serializeMappings }}
        >
            {children}
        </MIDILearnContext.Provider>
    );
}

export function useMIDILearn(): MIDILearnContextValue {
    const ctx = useContext(MIDILearnContext);
    if (!ctx) {
        throw new Error('useMIDILearn must be used within a MIDILearnProvider');
    }
    return ctx;
}
