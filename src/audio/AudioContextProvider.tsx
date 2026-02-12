import { createContext, useContext, useState, ReactNode } from 'react';

const AudioContextContext = createContext<AudioContext | null>(null);

interface AudioContextProviderProps {
    children: ReactNode;
}

export function AudioContextProvider({ children }: AudioContextProviderProps) {
    const [audioContext] = useState(() => new AudioContext());
    return <AudioContextContext.Provider value={audioContext}>{children}</AudioContextContext.Provider>;
}

export function useAudioContext(): AudioContext {
    const ctx = useContext(AudioContextContext);
    if (!ctx) {
        throw new Error('useAudioContext must be used within an AudioContextProvider');
    }
    return ctx;
}
