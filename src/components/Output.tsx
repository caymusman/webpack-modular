import { ChangeEvent, useRef, useState, useEffect, memo } from 'react';
import { getCenterPointFromEvent } from '../utils/centerPoint';
import { createGainNode } from '../audio/nodeFactories';
import { useAudioContext } from '../audio/AudioContextProvider';
import { CordToData } from '../types';

interface OutputProps {
    handleOutput: (info: CordToData) => void;
}

function Output({ handleOutput }: OutputProps) {
    const audioContext = useAudioContext();
    const gainNode = useRef(createGainNode(audioContext, 0.5));
    const [value, setValue] = useState<string | number>(0.5);

    useEffect(() => {
        gainNode.current.connect(audioContext.destination);
    }, [audioContext]);

    const onOutput = (event: React.MouseEvent | React.KeyboardEvent) => {
        const center = getCenterPointFromEvent(event);
        handleOutput({
            tomyKey: 'Output',
            toLocation: center,
            audio: gainNode.current,
        });
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        gainNode.current.gain.setValueAtTime(Number(event.target.value), audioContext.currentTime);
        setValue(event.target.value);
    };

    return (
        <div id="outputDiv">
            <p>Output</p>
            <div id="outputCenter">
                <input
                    id="gainSlider"
                    value={value}
                    type="range"
                    min="0"
                    max="1"
                    step=".05"
                    onChange={handleChange}
                    aria-label="Master volume"
                ></input>
            </div>
            <div
                className="cordOuter"
                role="button"
                aria-label="Connect to Output"
                tabIndex={0}
                onClick={onOutput}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOutput(e); } }}
            >
                <div className="cordInner" id={'Output' + 'inputInner'}></div>
            </div>
        </div>
    );
}

export default memo(Output);
