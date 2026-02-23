import { useState, useCallback, useRef, useEffect, memo } from 'react';
import Oscillator from './modules/Oscillator';
import Gain from './modules/Gain';
import Filter from './modules/Filter';
import Panner from './modules/Panner';
import ADSR from './modules/ADSR';
import Delay from './modules/Delay';
import Distortion from './modules/Distortion';
import Reverb from './modules/Reverb';
import AudioInput from './modules/AudioInput';
import Recorder from './modules/Recorder';
import Compressor from './modules/Compressor';
import Noise from './modules/Noise';
import LFO from './modules/LFO';
import Sequencer from './modules/Sequencer';
import { getCenterPointFromEvent } from '../utils/centerPoint';
import { CordFromData, CordToData } from '../types';
import type { SynthModule } from '../model/SynthModule';
import type { GainModule } from '../model/modules/GainModule';
import type { OscillatorModule } from '../model/modules/OscillatorModule';
import type { FilterModule } from '../model/modules/FilterModule';
import type { PannerModule } from '../model/modules/PannerModule';
import type { ADSRModule } from '../model/modules/ADSRModule';
import type { DelayModule } from '../model/modules/DelayModule';
import type { DistortionModule } from '../model/modules/DistortionModule';
import type { ReverbModule } from '../model/modules/ReverbModule';
import type { AudioInputModule } from '../model/modules/AudioInputModule';
import type { RecorderModule } from '../model/modules/RecorderModule';
import type { CompressorModule } from '../model/modules/CompressorModule';
import type { NoiseModule } from '../model/modules/NoiseModule';
import type { LFOModule } from '../model/modules/LFOModule';
import type { SequencerModule } from '../model/modules/SequencerModule';

interface AreaProps {
    myKey: string;
    filling: string;
    name: string;
    handleClose: (key: string) => void;
    outputMode: boolean;
    addPatch: (info: CordFromData) => void;
    handleOutput: (info: CordToData) => void;
    inputOnly: boolean;
    alert: (msg: string) => void;
    patchSource: string | null;
    module: SynthModule;
    handleNudge: (modID: string, dx: number, dy: number) => void;
}

const FOCUSABLE_SELECTORS =
    'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const NUDGE_SPEED = 500; // px/s — constant regardless of framerate or direction

function Area({
    myKey,
    filling,
    name,
    handleClose,
    outputMode,
    addPatch,
    handleOutput,
    inputOnly,
    alert,
    patchSource,
    module,
    handleNudge,
}: AreaProps) {
    const [closing, setClosing] = useState(false);
    const closingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const titleRef = useRef<HTMLParagraphElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Nudge loop state — all kept in refs so the RAF closure stays stable
    const heldKeys = useRef<Set<string>>(new Set());
    const rafRef = useRef<number | null>(null);
    const accumRef = useRef({ x: 0, y: 0 });
    const handleNudgeRef = useRef(handleNudge);
    useEffect(() => {
        handleNudgeRef.current = handleNudge;
    }, [handleNudge]);

    // Cancel any running nudge loop when the component unmounts
    useEffect(() => {
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    const startNudgeLoop = useCallback(() => {
        if (rafRef.current !== null) return;
        accumRef.current = { x: 0, y: 0 };
        let lastTime: number | null = null;

        const loop = (now: number) => {
            const dt = Math.min((now - (lastTime ?? now)) / 1000, 0.05); // cap at 50 ms
            lastTime = now;

            let dx = 0,
                dy = 0;
            if (heldKeys.current.has('ArrowLeft')) dx -= 1;
            if (heldKeys.current.has('ArrowRight')) dx += 1;
            if (heldKeys.current.has('ArrowUp')) dy -= 1;
            if (heldKeys.current.has('ArrowDown')) dy += 1;

            if (dx !== 0 || dy !== 0) {
                // Normalize so diagonal movement has the same speed as cardinal
                const len = Math.sqrt(dx * dx + dy * dy);
                accumRef.current.x += (dx / len) * NUDGE_SPEED * dt;
                accumRef.current.y += (dy / len) * NUDGE_SPEED * dt;

                // Only pass whole-pixel moves to keep positions integers
                const intX = Math.trunc(accumRef.current.x);
                const intY = Math.trunc(accumRef.current.y);
                accumRef.current.x -= intX;
                accumRef.current.y -= intY;

                if (intX !== 0 || intY !== 0) {
                    handleNudgeRef.current(myKey, intX, intY);
                }
            }

            if (heldKeys.current.size > 0) {
                rafRef.current = requestAnimationFrame(loop);
            } else {
                rafRef.current = null;
            }
        };

        rafRef.current = requestAnimationFrame(loop);
    }, [myKey]);

    const stopNudgeLoop = useCallback(() => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        heldKeys.current.clear();
        accumRef.current = { x: 0, y: 0 };
    }, []);

    const getAudioNode = useCallback((): AudioNode => {
        try {
            return module.getNode();
        } catch {
            return {} as AudioNode;
        }
    }, [module]);

    const onClose = useCallback(() => {
        if (closing) return;
        setClosing(true);
        closingTimer.current = setTimeout(() => {
            handleClose(myKey);
        }, 250);
    }, [closing, handleClose, myKey]);

    const handleCreatePatch = useCallback(
        (event: React.MouseEvent | React.KeyboardEvent) => {
            if (!outputMode) {
                const center = getCenterPointFromEvent(event);
                addPatch({
                    fromModID: myKey,
                    fromLocation: center,
                    audio: getAudioNode(),
                });
            }
        },
        [outputMode, addPatch, myKey, getAudioNode]
    );

    const onOutput = useCallback(
        (event: React.MouseEvent | React.KeyboardEvent) => {
            const center = getCenterPointFromEvent(event);
            handleOutput({
                tomyKey: myKey,
                toLocation: center,
                audio: getAudioNode(),
            });
        },
        [handleOutput, myKey, getAudioNode]
    );

    const handleContainerKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === 'Tab') {
                // In patch mode the global Tab handler takes over — let it through
                if (outputMode) return;
                if (!containerRef.current) return;

                // Tab from the title bar itself → jump to the adjacent module's title bar
                if (document.activeElement === titleRef.current) {
                    const allHandles = Array.from(
                        document.querySelectorAll<HTMLElement>('[data-module-handle]')
                    );
                    const myIdx = allHandles.indexOf(titleRef.current!);
                    e.preventDefault();
                    if (!e.shiftKey) {
                        const next = allHandles[myIdx + 1] ?? allHandles[0];
                        next?.focus();
                    } else {
                        const prev = allHandles[myIdx - 1] ?? allHandles[allHandles.length - 1];
                        prev?.focus();
                    }
                    return;
                }

                // Tab trap within the module for all other controls
                const focusable = Array.from(
                    containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
                ).filter((el) => getComputedStyle(el).visibility !== 'hidden');
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            } else if (e.key === 'Escape' && !outputMode) {
                if (document.activeElement === titleRef.current) {
                    e.preventDefault();
                    titleRef.current?.blur();
                } else {
                    e.preventDefault();
                    e.stopPropagation();
                    titleRef.current?.focus();
                }
            }
            // When outputMode, Escape bubbles to the window patch-cancel listener
        },
        [outputMode]
    );

    const renderFilling = () => {
        switch (filling) {
            case 'Oscillator':
                return <Oscillator module={module as OscillatorModule} parent={myKey} handleOutput={handleOutput} />;
            case 'Gain':
                return <Gain module={module as GainModule} parent={myKey} handleOutput={handleOutput} />;
            case 'Filter':
                return <Filter module={module as FilterModule} parent={myKey} />;
            case 'Panner':
                return <Panner module={module as PannerModule} parent={myKey} />;
            case 'ADSR':
                return <ADSR module={module as ADSRModule} parent={myKey} />;
            case 'Delay':
                return <Delay module={module as DelayModule} parent={myKey} />;
            case 'Distortion':
                return <Distortion module={module as DistortionModule} parent={myKey} />;
            case 'Reverb':
                return <Reverb module={module as ReverbModule} />;
            case 'AudioInput':
                return <AudioInput module={module as AudioInputModule} alert={alert} handleClose={onClose} />;
            case 'Recorder':
                return <Recorder module={module as RecorderModule} />;
            case 'Compressor':
                return <Compressor module={module as CompressorModule} />;
            case 'Noise':
                return <Noise module={module as NoiseModule} />;
            case 'LFO':
                return <LFO module={module as LFOModule} />;
            case 'Sequencer':
                return <Sequencer module={module as SequencerModule} />;
            default:
                return <div>Hahahahaha theres nothing here!</div>;
        }
    };

    return (
        <div
            className={`moduleDiv${closing ? ' moduleDiv--closing' : ''}`}
            ref={containerRef}
            onKeyDown={handleContainerKeyDown}
        >
            <p
                ref={titleRef}
                data-module-handle=""
                tabIndex={0}
                aria-label={name + ' module'}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const firstControl = containerRef.current
                            ?.querySelector<HTMLElement>('#innerModDiv')
                            ?.querySelector<HTMLElement>(FOCUSABLE_SELECTORS);
                        firstControl?.focus();
                    } else if (e.key === 'Delete' || e.key === 'Backspace') {
                        e.preventDefault();
                        onClose();
                    } else if (
                        e.key === 'ArrowLeft' ||
                        e.key === 'ArrowRight' ||
                        e.key === 'ArrowUp' ||
                        e.key === 'ArrowDown'
                    ) {
                        e.preventDefault();
                        heldKeys.current.add(e.key);
                        startNudgeLoop();
                    }
                }}
                onKeyUp={(e) => {
                    heldKeys.current.delete(e.key);
                    if (heldKeys.current.size === 0) stopNudgeLoop();
                }}
                onBlur={stopNudgeLoop}
            >
                <button onClick={onClose} aria-label={'Close ' + name} className="iconBtn">
                    <i className="fa fa-times" aria-hidden="true"></i>
                </button>
                {name}
            </p>

            {/*eventually will be unique module fillings*/}
            <div id="innerModDiv">{renderFilling()}</div>

            {/*input patch cords area*/}
            <div
                className={
                    outputMode && patchSource === myKey
                        ? 'cordOuter show patchSource'
                        : outputMode
                          ? 'cordOuter hide'
                          : 'cordOuter show interactive'
                }
                id="outputOuter"
                role="button"
                aria-label={'Connect from ' + name}
                tabIndex={0}
                onClick={handleCreatePatch}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCreatePatch(e);
                    }
                }}
            >
                <div className="cordInner" id={myKey + 'outputInner'}></div>
            </div>
            {/*output patch cords area*/}

            {!inputOnly && (
                <div
                    className={outputMode ? 'cordOuter show raise interactive' : 'cordOuter show'}
                    id="inputOuter"
                    role="button"
                    aria-label={'Connect to ' + name}
                    tabIndex={0}
                    onClick={onOutput}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onOutput(e);
                        }
                    }}
                >
                    <div className="cordInner" id={myKey + 'inputInner'}></div>
                </div>
            )}
        </div>
    );
}

export default memo(Area);
