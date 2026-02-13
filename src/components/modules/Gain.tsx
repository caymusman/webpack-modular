import { ChangeEvent, useRef, useState, useEffect } from 'react';
import { makeParamKey } from '../../utils/moduleId';
import { getCenterPointFromEvent } from '../../utils/centerPoint';
import { createGainNode } from '../../audio/nodeFactories';
import { useAudioContext } from '../../audio/AudioContextProvider';
import { CordToData } from '../../types';

interface GainProps {
    createAudio: (node: AudioNode) => void;
    parent: string;
    handleOutput: (info: CordToData) => void;
}

function Gain({ createAudio, parent, handleOutput }: GainProps) {
    const audioContext = useAudioContext();
    const audio = useRef(createGainNode(audioContext, 0.5));
    const [value, setValue] = useState<string | number>(0.5);
    const [num, setNum] = useState<string | number>(0.5);
    const max = 1;
    const min = 0;

    useEffect(() => {
        createAudio(audio.current);
    }, [createAudio, audioContext]);

    const handleGainChange = (event: ChangeEvent<HTMLInputElement>) => {
        let gainVal: number = Number(event.target.value);
        if (gainVal > 1) {
            gainVal = 1;
        } else if (gainVal < 0) {
            gainVal = 0;
        }
        audio.current.gain.setValueAtTime(gainVal, audioContext.currentTime);
        setValue(gainVal);
        setNum(gainVal);
    };

    const handleNumChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (isNaN(Number(event.target.value))) {
            return;
        }
        setNum(event.target.value);
    };

    const handleNumGainChange = () => {
        let temp: number = Number(num);
        if (temp > max) {
            temp = max;
        } else if (temp < min) {
            temp = min;
        }
        setValue(temp);
        setNum(temp);
    };

    const onOutput = (event: React.MouseEvent | React.KeyboardEvent) => {
        const center = getCenterPointFromEvent(event);
        handleOutput({
            tomyKey: makeParamKey(parent),
            toLocation: center,
            audio: audio.current.gain,
        });
    };

    return (
        <div className="gainDiv">
            <input
                id="gainRangeInput"
                type="range"
                value={value}
                min="0"
                max="1"
                step=".01"
                onChange={handleGainChange}
                aria-label="Gain"
            ></input>
            <input
                id="gainNumInput"
                value={num}
                type="text"
                onChange={handleNumChange}
                aria-label="Gain value"
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        handleNumGainChange();
                    }
                }}
            ></input>

            <div className="cordOuter tooltip" id="firstParam" role="button" aria-label="Connect to gain param" tabIndex={0} onClick={onOutput} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOutput(e); } }}>
                <div className="cordInner" id={makeParamKey(parent) + ' inputInner'}>
                    <span className="tooltiptext">
                        <span className="paramSpan">param: </span>gain
                    </span>
                </div>
            </div>
        </div>
    );
}

export default Gain;
