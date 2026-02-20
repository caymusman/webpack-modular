import { useState, useCallback, useRef, memo } from 'react';
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
}

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
}: AreaProps) {
    const [closing, setClosing] = useState(false);
    const closingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const renderFilling = () => {
        switch (filling) {
            case 'Oscillator':
                return <Oscillator module={module as OscillatorModule} parent={myKey} handleOutput={handleOutput} />;
            case 'Gain':
                return <Gain module={module as GainModule} parent={myKey} handleOutput={handleOutput} />;
            case 'Filter':
                return <Filter module={module as FilterModule} />;
            case 'Panner':
                return <Panner module={module as PannerModule} />;
            case 'ADSR':
                return <ADSR module={module as ADSRModule} />;
            case 'Delay':
                return <Delay module={module as DelayModule} />;
            case 'Distortion':
                return <Distortion module={module as DistortionModule} />;
            case 'Reverb':
                return <Reverb module={module as ReverbModule} />;
            case 'AudioInput':
                return <AudioInput module={module as AudioInputModule} alert={alert} handleClose={onClose} />;
            case 'Recorder':
                return <Recorder module={module as RecorderModule} />;
            default:
                return <div>Hahahahaha theres nothing here!</div>;
        }
    };

    return (
        <div className={`moduleDiv${closing ? ' moduleDiv--closing' : ''}`}>
            <p id="modTitle">
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
