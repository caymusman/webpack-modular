import { useState, useEffect, useCallback } from 'react';
import Selector from '../ui/Selector';
import Slider from '../ui/Slider';
import { useParam } from '../../hooks/useParam';
import { makeParamKey } from '../../utils/moduleId';
import { getCenterPointFromEvent } from '../../utils/centerPoint';
import type { CordToData } from '../../types';
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

function freqToNoteName(freq: number): string {
    return ALL_NOTES.find(n => Math.abs(n.freq - freq) < 0.5)?.name ?? '';
}

interface SequencerProps {
    module: SequencerModule;
    parent: string;
    handleOutput: (info: CordToData) => void;
}

function Sequencer({ module, parent, handleOutput }: SequencerProps) {
    const [, setBpm] = useParam(module.params.bpm);
    const [, setWaveType] = useParam(module.params.waveType);
    const [rateCVDepth, setRateCVDepth] = useParam(module.params.rateCVDepth);
    const [playing, setPlaying] = useState(false);
    const [activeStep, setActiveStep] = useState(-1);
    const [steps, setSteps] = useState<number[]>([...module.steps]);
    const [activeSteps, setActiveSteps] = useState<boolean[]>([...module.activeSteps]);
    const [stepCount, setStepCount] = useState(module.steps.length);

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

    /** Commit a raw Hz value typed into the Hz input. */
    const commitHz = useCallback((stepIdx: number, text: string) => {
        const v = parseFloat(text);
        if (!isNaN(v) && v > 0) {
            // eslint-disable-next-line react-hooks/immutability
            module.steps[stepIdx] = Math.max(20, Math.min(20000, v));
            setSteps([...module.steps]);
        }
    }, [module]);

    /** Commit a note name (e.g. "C4", "A#3") typed into the note input. */
    const commitNote = useCallback((stepIdx: number, text: string) => {
        const note = ALL_NOTES.find(n => n.name.toLowerCase() === text.trim().toLowerCase());
        if (note) {
            // eslint-disable-next-line react-hooks/immutability
            module.steps[stepIdx] = note.freq;
            setSteps([...module.steps]);
        }
    }, [module]);

    const toggleActive = useCallback((stepIdx: number) => {
        // eslint-disable-next-line react-hooks/immutability
        module.activeSteps[stepIdx] = !module.activeSteps[stepIdx];
        setActiveSteps([...module.activeSteps]);
    }, [module]);

    const onRateCVOutput = useCallback((event: React.MouseEvent | React.KeyboardEvent) => {
        const center = getCenterPointFromEvent(event);
        handleOutput({
            tomyKey: makeParamKey(parent),
            toLocation: center,
            audio: module.getParamNode()!,
        });
    }, [handleOutput, parent, module]);

    const handleStepCountChange = useCallback((delta: number) => {
        const newCount = Math.max(2, Math.min(16, stepCount + delta));
        module.setStepCount(newCount);
        setStepCount(newCount);
        setSteps([...module.steps]);
        setActiveSteps([...module.activeSteps]);
    }, [module, stepCount]);

    return (
        <div className="sequencerDiv">
            {/* Row 1: play + step count + wave type */}
            <div className="sequencerDiv__topRow">
                <button
                    className="sequencerDiv__playBtn"
                    onClick={handlePlayStop}
                    aria-label={playing ? 'Stop sequencer' : 'Play sequencer'}
                >
                    <i className={`fa ${playing ? 'fa-stop' : 'fa-play'}`} aria-hidden="true" />
                </button>
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
                <Selector
                    id="seqWaveSelector"
                    values={['sine', 'sawtooth', 'triangle', 'square']}
                    handleClick={(v) => setWaveType(v as typeof module.params.waveType.value)}
                />
            </div>
            {/* Row 2: BPM */}
            <Slider
                labelName="seqBpm"
                tooltipText="BPM"
                min={30}
                max={600}
                step={1}
                setAudio={setBpm}
                initialValue={module.params.bpm.value}
            />
            {/* Param dock for Rate CV */}
            <div
                className="cordOuter tooltip"
                id="firstParam"
                role="button"
                aria-label="Connect to Rate CV param"
                tabIndex={0}
                onClick={onRateCVOutput}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onRateCVOutput(e);
                    }
                }}
            >
                <div className="cordInner" id={makeParamKey(parent) + ' inputInner'}>
                    <span className="tooltiptext">
                        <span className="paramSpan">param: </span>Rate CV
                    </span>
                </div>
            </div>
            {/* Row 3: Rate CV Depth */}
            <Slider
                labelName="seqRateDepth"
                tooltipText="Rate CV Depth"
                min={0}
                max={200}
                step={1}
                setAudio={setRateCVDepth}
                initialValue={rateCVDepth as number}
            />
            {/* Steps: one row per step */}
            <div className="sequencerDiv__steps">
                {steps.map((freq, i) => {
                    const isActive = activeSteps[i];
                    const isPlaying = activeStep === i;
                    const noteName = freqToNoteName(freq);

                    return (
                        <div
                            key={i}
                            className={`sequencerDiv__step${isPlaying ? ' sequencerDiv__step--playing' : ''}`}
                        >
                            <button
                                className={`sequencerDiv__stepToggle${isActive ? ' sequencerDiv__stepToggle--on' : ''}`}
                                onClick={() => toggleActive(i)}
                                aria-label={`Step ${i + 1} ${isActive ? 'active, click to mute' : 'muted, click to activate'}`}
                            />
                            <input
                                key={`hz-${i}-${freq}`}
                                className={`sequencerDiv__stepHz${!isActive ? ' sequencerDiv__stepHz--muted' : ''}`}
                                type="text"
                                defaultValue={freq.toFixed(2)}
                                aria-label={`Step ${i + 1} frequency in Hz`}
                                onBlur={e => commitHz(i, e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        commitHz(i, e.currentTarget.value);
                                        e.currentTarget.blur();
                                    }
                                }}
                            />
                            <input
                                key={`note-${i}-${freq}`}
                                className={`sequencerDiv__stepNote${!isActive ? ' sequencerDiv__stepNote--muted' : ''}`}
                                type="text"
                                defaultValue={noteName}
                                placeholder="—"
                                aria-label={`Step ${i + 1} note name`}
                                onBlur={e => commitNote(i, e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        commitNote(i, e.currentTarget.value);
                                        e.currentTarget.blur();
                                    }
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Sequencer;
