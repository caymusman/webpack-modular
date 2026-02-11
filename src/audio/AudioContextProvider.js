import { createContext, useContext, useState } from 'react';

const AudioContextContext = createContext(null);

export function AudioContextProvider({ children }) {
    const [audioContext] = useState(() => new AudioContext());
    return <AudioContextContext.Provider value={audioContext}>{children}</AudioContextContext.Provider>;
}

export function useAudioContext() {
    const ctx = useContext(AudioContextContext);
    if (!ctx) {
        throw new Error('useAudioContext must be used within an AudioContextProvider');
    }
    return ctx;
}
