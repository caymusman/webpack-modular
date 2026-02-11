import { useState, useCallback } from 'react';
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

function Area({
    myKey,
    filling,
    name,
    handleClose,
    outputMode,
    addPatch,
    handleOutput,
    inputOnly,
    audioContext,
    alert,
}) {
    const [audio, setAudio] = useState({});

    const onClose = useCallback(() => {
        handleClose(myKey);
    }, [handleClose, myKey]);

    const handleCreatePatch = useCallback(
        (event) => {
            if (!outputMode) {
                const largerDim = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth;
                const el = event.target.getBoundingClientRect();
                const x = el.x;
                const y = el.y;
                const bottom = el.bottom;
                const right = el.right;
                const xCenter = (right - x) / 2 + x - largerDim * 0.04;
                const yCenter = (bottom - y) / 2 + y - largerDim * 0.04;
                addPatch({
                    fromModID: myKey,
                    fromLocation: { x: xCenter, y: yCenter },
                    audio: audio,
                });
            }
        },
        [outputMode, addPatch, myKey, audio]
    );

    const onOutput = useCallback(
        (event) => {
            const largerDim = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth;
            const el = event.target.getBoundingClientRect();
            const x = el.x;
            const y = el.y;
            const bottom = el.bottom;
            const right = el.right;
            const xCenter = (right - x) / 2 + x - largerDim * 0.04;
            const yCenter = (bottom - y) / 2 + y - largerDim * 0.04;

            handleOutput({
                tomyKey: myKey,
                toLocation: { x: xCenter, y: yCenter },
                audio: audio,
            });
        },
        [handleOutput, myKey, audio]
    );

    const createAudio = useCallback((childAudio) => {
        setAudio(childAudio);
    }, []);

    const renderFilling = () => {
        switch (filling) {
            case 'Oscillator':
                return (
                    <Oscillator
                        audioContext={audioContext}
                        createAudio={createAudio}
                        parent={myKey}
                        handleOutput={handleOutput}
                    />
                );
            case 'Gain':
                return (
                    <Gain
                        audioContext={audioContext}
                        createAudio={createAudio}
                        parent={myKey}
                        handleOutput={handleOutput}
                    />
                );
            case 'Filter':
                return <Filter audioContext={audioContext} createAudio={createAudio} />;
            case 'Panner':
                return <Panner audioContext={audioContext} createAudio={createAudio} />;
            case 'ADSR':
                return <ADSR audioContext={audioContext} createAudio={createAudio} />;
            case 'Delay':
                return <Delay audioContext={audioContext} createAudio={createAudio} />;
            case 'Distortion':
                return <Distortion audioContext={audioContext} createAudio={createAudio} />;
            case 'Reverb':
                return <Reverb audioContext={audioContext} createAudio={createAudio} />;
            case 'AudioInput':
                return (
                    <AudioInput
                        alert={alert}
                        handleClose={onClose}
                        audioContext={audioContext}
                        createAudio={createAudio}
                    />
                );
            case 'Recorder':
                return <Recorder audioContext={audioContext} createAudio={createAudio} />;
            default:
                return <div>Hahahahaha theres nothing here!</div>;
        }
    };

    return (
        <div className="moduleDiv">
            <p id="modTitle">
                <i className="fa fa-times" aria-hidden="true" onClick={onClose}></i>
                {name}
            </p>

            {/*eventually will be unique module fillings*/}
            <div id="innerModDiv">{renderFilling()}</div>

            {/*input patch cords area*/}
            <div
                className={outputMode ? 'cordOuter hide' : 'cordOuter show interactive'}
                id="outputOuter"
                onClick={handleCreatePatch}
            >
                <div className="cordInner" id={myKey + 'outputInner'}></div>
            </div>
            {/*output patch cords area*/}

            {inputOnly === 'false' && (
                <div
                    className={outputMode ? 'cordOuter show raise interactive' : 'cordOuter show'}
                    id="inputOuter"
                    onClick={onOutput}
                >
                    <div className="cordInner" id={myKey + 'inputInner'}></div>
                </div>
            )}
        </div>
    );
}

export default Area;
