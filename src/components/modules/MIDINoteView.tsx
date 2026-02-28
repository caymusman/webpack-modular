import { useEffect, useState } from 'react';
import type { MIDINoteModule } from '../../model/modules/MIDINoteModule';

interface MIDINoteViewProps {
    module: MIDINoteModule;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function midiToNoteName(midi: number): string {
    const octave = Math.floor(midi / 12) - 1;
    return NOTE_NAMES[midi % 12] + octave;
}

function midiToHz(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

export default function MIDINoteView({ module }: MIDINoteViewProps) {
    const [currentNote, setCurrentNote] = useState<number | null>(null);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            const { note, on } = (e as CustomEvent<{ note: number; velocity: number; on: boolean }>).detail;
            if (on) {
                const hz = midiToHz(note);
                module.setFrequency(hz);
                setCurrentNote(note);
                setIsActive(true);
            } else {
                setIsActive(false);
                // Frequency holds at last played note — keep currentNote for display
            }
        };
        window.addEventListener('midi-note', handler);
        return () => window.removeEventListener('midi-note', handler);
    }, [module]);

    return (
        <div className="midiNoteDiv">
            {currentNote === null ? (
                <div className="midiNoteDiv__waiting">Play a MIDI note</div>
            ) : (
                <>
                    <div className={`midiNoteDiv__note${isActive ? '' : ' midiNoteDiv__note--held'}`}>
                        {midiToNoteName(currentNote)}
                        {!isActive && <span className="midiNoteDiv__heldBadge">held</span>}
                    </div>
                    <div className="midiNoteDiv__hz">{midiToHz(currentNote).toFixed(2)} Hz</div>
                </>
            )}
            <div className="midiNoteDiv__hint">connect output → osc freq / filter cutoff</div>
        </div>
    );
}
