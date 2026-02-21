import { useState, useEffect, useCallback } from 'react';
import Selector from '../ui/Selector';
import Slider from '../ui/Slider';
import { useParam } from '../../hooks/useParam';
import type { SequencerModule } from '../../model/modules/SequencerModule';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// All playable notes: C2 – B6
const ALL_NOTES: { name: string; freq: number }[] = [];
for (let octave = 2; octave <= 6; octave++) {
    for (let i = 0; i < 12; i++) {
        const semitones = (octave - 4) * 12 + i - 9; // semitones from A4
        ALL_NOTES.push({
            name: `${NOTE_NAMES[i]}${octave}`,
            freq: 440 * Math.pow(2, semitones / 12),
        });
    }
}

function freqToNoteIndex(freq: number): number {
    const idx = ALL_NOTES.findIndex((n) => Math.abs(n.freq - freq) < 0.5);
    return idx >= 0 ? idx : 0;
}

interface SequencerProps {
    module: SequencerModule;
}

function Sequencer({ module }: SequencerProps) {
    const [, setBpm] = useParam(module.params.bpm);
    const [, setWaveType] = useParam(module.params.waveType);
    const [playing, setPlaying] = useState(false);
    const [activeStep, setActiveStep] = useState(-1);
    // Local copy of step state for rendering
    const [steps, setSteps] = useState<number[]>([...module.steps]);
    const [activeSteps, setActiveSteps] = useState<boolean[]>([...module.activeSteps]);
    const [stepCount, setStepCount] = useState(module.steps.length);

    // Wire up the step callback
    useEffect(() => {
        // eslint-disable-next-line react-hooks/immutability
        module.onStep = (step) => setActiveStep(step);
        // eslint-disable-next-line react-hooks/immutability
        return () => { module.onStep = null; };
    }, [module]);

    const handlePlayStop = useCallback(() => {
        if (playing) {
            module.stop();
            setPlaying(false);
            setActiveStep(-1);
        } else {
            module.start();
            setPlaying(true);
        }
    }, [playing, module]);

    const cycleNote = useCallback((stepIdx: number, direction: 1 | -1) => {
        const current = freqToNoteIndex(module.steps[stepIdx]);
        const next = Math.max(0, Math.min(ALL_NOTES.length - 1, current + direction));
        // eslint-disable-next-line react-hooks/immutability
        module.steps[stepIdx] = ALL_NOTES[next].freq;
        setSteps([...module.steps]);
    }, [module]);

    const toggleActive = useCallback((stepIdx: number) => {
        // eslint-disable-next-line react-hooks/immutability
        module.activeSteps[stepIdx] = !module.activeSteps[stepIdx];
        setActiveSteps([...module.activeSteps]);
    }, [module]);

    const handleStepCountChange = useCallback((delta: number) => {
        const newCount = Math.max(2, Math.min(16, stepCount + delta));
        module.setStepCount(newCount);
        setStepCount(newCount);
        setSteps([...module.steps]);
        setActiveSteps([...module.activeSteps]);
    }, [module, stepCount]);

    return (
        <div className="sequencerDiv">
            <div className="sequencerDiv__controls">
                <Selector
                    id="seqWaveSelector"
                    values={['sine', 'sawtooth', 'triangle', 'square']}
                    handleClick={(v) => setWaveType(v as typeof module.params.waveType.value)}
                />
                <button
                    className="sequencerDiv__playBtn"
                    onClick={handlePlayStop}
                    aria-label={playing ? 'Stop sequencer' : 'Play sequencer'}
                >
                    <i className={`fa ${playing ? 'fa-stop' : 'fa-play'}`} aria-hidden="true" />
                </button>
                <Slider
                    labelName="seqBpm"
                    tooltipText="BPM"
                    min={30}
                    max={300}
                    step={1}
                    setAudio={setBpm}
                />
                <div className="sequencerDiv__stepCount">
                    <button
                        className="sequencerDiv__stepCountBtn"
                        onClick={() => handleStepCountChange(-1)}
                        disabled={stepCount <= 2}
                        aria-label="Remove step"
                    >−</button>
                    <span className="sequencerDiv__stepCountNum" aria-label={`Step count: ${stepCount}`}>{stepCount}</span>
                    <button
                        className="sequencerDiv__stepCountBtn"
                        onClick={() => handleStepCountChange(1)}
                        disabled={stepCount >= 16}
                        aria-label="Add step"
                    >+</button>
                </div>
            </div>
            <div className="sequencerDiv__steps" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
                {steps.map((freq, i) => {
                    const noteIdx = freqToNoteIndex(freq);
                    const noteName = ALL_NOTES[noteIdx]?.name ?? '?';
                    const isActive = activeSteps[i];
                    const isPlaying = activeStep === i;

                    return (
                        <div
                            key={i}
                            className={`sequencerDiv__step${isActive ? '' : ' sequencerDiv__step--muted'}${isPlaying ? ' sequencerDiv__step--playing' : ''}`}
                        >
                            <button
                                className="sequencerDiv__stepNote"
                                onClick={() => cycleNote(i, 1)}
                                onContextMenu={(e) => { e.preventDefault(); cycleNote(i, -1); }}
                                aria-label={`Step ${i + 1} note: ${noteName}. Click to go up, right-click to go down`}
                                title="Click: note up · Right-click: note down"
                            >
                                {noteName}
                            </button>
                            <button
                                className={`sequencerDiv__stepToggle${isActive ? ' sequencerDiv__stepToggle--on' : ''}`}
                                onClick={() => toggleActive(i)}
                                aria-label={`Step ${i + 1} ${isActive ? 'active, click to mute' : 'muted, click to activate'}`}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Sequencer;
