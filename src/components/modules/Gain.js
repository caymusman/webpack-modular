import { useRef, useState, useEffect } from 'react';

function Gain({ audioContext, createAudio, parent, handleOutput }) {
    const audio = useRef(audioContext.createGain());
    const [value, setValue] = useState(0.5);
    const [num, setNum] = useState(0.5);
    const max = 1;
    const min = 0;

    useEffect(() => {
        createAudio(audio.current);
        audio.current.gain.setValueAtTime(0.5, audioContext.currentTime);
    }, [createAudio, audioContext]);

    const handleGainChange = (event) => {
        let gainVal = event.target.value;
        if (gainVal > 1) {
            gainVal = 1;
        } else if (gainVal < 0) {
            gainVal = 0;
        }
        audio.current.gain.setValueAtTime(gainVal, audioContext.currentTime);
        setValue(gainVal);
        setNum(gainVal);
    };

    const handleNumChange = (event) => {
        if (isNaN(event.target.value)) {
            return;
        }
        setNum(event.target.value);
    };

    const handleNumGainChange = () => {
        let temp = num;
        if (temp > max) {
            temp = max;
        } else if (temp < min) {
            temp = min;
        }
        setValue(temp);
        setNum(temp);
    };

    const onOutput = (event) => {
        const largerDim = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth;
        const el = event.target.getBoundingClientRect();
        const x = el.x;
        const y = el.y;
        const bottom = el.bottom;
        const right = el.right;
        const xCenter = (right - x) / 2 + x - largerDim * 0.04;
        const yCenter = (bottom - y) / 2 + y - largerDim * 0.04;

        handleOutput({
            tomyKey: parent + ' param',
            toLocation: { x: xCenter, y: yCenter },
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
            ></input>
            <input
                id="gainNumInput"
                value={num}
                type="text"
                onChange={handleNumChange}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        handleNumGainChange();
                    }
                }}
            ></input>

            <div className="cordOuter tooltip" id="firstParam" onClick={onOutput}>
                <div className="cordInner" id={parent + ' param' + ' inputInner'}>
                    <span id="gainGainParamTip" className="tooltiptext">
                        <span className="paramSpan">param: </span>gain
                    </span>
                </div>
            </div>
        </div>
    );
}

export default Gain;
