import { useRef, useState, useEffect, memo } from 'react';
import { getCenterPointFromEvent } from '../utils/centerPoint';
import { createGainNode } from '../audio/nodeFactories';
import { useAudioContext } from '../audio/AudioContextProvider';

function Output({ handleOutput }) {
    const audioContext = useAudioContext();
    const gainNode = useRef(createGainNode(audioContext, 0.5));
    const [value, setValue] = useState(0.5);

    useEffect(() => {
        gainNode.current.connect(audioContext.destination);
    }, [audioContext]);

    const onOutput = (event) => {
        const center = getCenterPointFromEvent(event);
        handleOutput({
            tomyKey: 'Output',
            toLocation: center,
            audio: gainNode.current,
        });
    };

    const handleChange = (event) => {
        gainNode.current.gain.setValueAtTime(event.target.value, audioContext.currentTime);
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
