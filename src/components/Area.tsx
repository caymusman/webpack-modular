import { useState, useCallback, memo } from 'react';
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
}: AreaProps) {
    const [audio, setAudio] = useState<AudioNode>({} as AudioNode);

    const onClose = useCallback(() => {
        handleClose(myKey);
    }, [handleClose, myKey]);

    const handleCreatePatch = useCallback(
        (event: React.MouseEvent | React.KeyboardEvent) => {
            if (!outputMode) {
                const center = getCenterPointFromEvent(event);
                addPatch({
                    fromModID: myKey,
                    fromLocation: center,
                    audio: audio,
                });
            }
        },
        [outputMode, addPatch, myKey, audio]
    );

    const onOutput = useCallback(
        (event: React.MouseEvent | React.KeyboardEvent) => {
            const center = getCenterPointFromEvent(event);
            handleOutput({
                tomyKey: myKey,
                toLocation: center,
                audio: audio,
            });
        },
        [handleOutput, myKey, audio]
    );

    const createAudio = useCallback((childAudio: AudioNode) => {
        setAudio(childAudio);
    }, []);

    const renderFilling = () => {
        switch (filling) {
            case 'Oscillator':
                return (
                    <Oscillator
                        createAudio={createAudio}
                        parent={myKey}
                        handleOutput={handleOutput}
                    />
                );
            case 'Gain':
                return (
                    <Gain
                        createAudio={createAudio}
                        parent={myKey}
                        handleOutput={handleOutput}
                    />
                );
            case 'Filter':
                return <Filter createAudio={createAudio} />;
            case 'Panner':
                return <Panner createAudio={createAudio} />;
            case 'ADSR':
                return <ADSR createAudio={createAudio} />;
            case 'Delay':
                return <Delay createAudio={createAudio} />;
            case 'Distortion':
                return <Distortion createAudio={createAudio} />;
            case 'Reverb':
                return <Reverb createAudio={createAudio} />;
            case 'AudioInput':
                return (
                    <AudioInput
                        alert={alert}
                        handleClose={onClose}
                        createAudio={createAudio}
                    />
                );
            case 'Recorder':
                return <Recorder createAudio={createAudio} />;
            default:
                return <div>Hahahahaha theres nothing here!</div>;
        }
    };

    return (
        <div className="moduleDiv">
            <p id="modTitle">
                <button onClick={onClose} aria-label={'Close ' + name} className="iconBtn"><i className="fa fa-times" aria-hidden="true"></i></button>
                {name}
            </p>

            {/*eventually will be unique module fillings*/}
            <div id="innerModDiv">{renderFilling()}</div>

            {/*input patch cords area*/}
            <div
                className={outputMode && patchSource === myKey ? 'cordOuter show patchSource' : outputMode ? 'cordOuter hide' : 'cordOuter show interactive'}
                id="outputOuter"
                role="button"
                aria-label={'Connect from ' + name}
                tabIndex={0}
                onClick={handleCreatePatch}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCreatePatch(e); } }}
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
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOutput(e); } }}
                >
                    <div className="cordInner" id={myKey + 'inputInner'}></div>
                </div>
            )}
        </div>
    );
}

export default memo(Area);
