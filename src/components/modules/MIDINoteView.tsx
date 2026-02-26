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

export default function MIDINoteView({ module }: MIDINoteViewProps) {
    const [currentNote, setCurrentNote] = useState<number | null>(null);

    useEffect(() => {
        const handler = (e: Event) => {
            const { note, on } = (e as CustomEvent<{ note: number; velocity: number; on: boolean }>).detail;
            if (on) {
                const hz = 440 * Math.pow(2, (note - 69) / 12);
                module.setFrequency(hz);
                setCurrentNote(note);
            } else {
                setCurrentNote(null);
            }
        };
        window.addEventListener('midi-note', handler);
        return () => window.removeEventListener('midi-note', handler);
    }, [module]);

    return (
        <div className="midiNoteDiv">
            {currentNote !== null ? (
                <>
                    <div className="midiNoteDiv__note">{midiToNoteName(currentNote)}</div>
                    <div className="midiNoteDiv__hz">
                        {(440 * Math.pow(2, (currentNote - 69) / 12)).toFixed(2)} Hz
                    </div>
                </>
            ) : (
                <div className="midiNoteDiv__waiting">— waiting —</div>
            )}
        </div>
    );
}
