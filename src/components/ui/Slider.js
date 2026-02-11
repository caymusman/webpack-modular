import { useState } from 'react';

function Slider({ labelName, tooltipText, min, max, step, setAudio }) {
    const [num, setNum] = useState((max + min) / 2);
    const [val, setVal] = useState((max + min) / 2);

    const handleRangeChange = (event) => {
        let v = event.target.value;
        if (v > max) {
            v = max;
        } else if (v < min) {
            v = min;
        }
        setAudio(v);
        setVal(v);
        setNum(v);
    };

    const handleNumChange = (event) => {
        if (isNaN(event.target.value) && event.target.value !== '-') {
            return;
        }
        setNum(event.target.value);
    };

    const handleNumSubmit = () => {
        let temp = num;
        if (temp > max) {
            temp = max;
        } else if (temp < min) {
            temp = min;
        }
        setVal(temp);
        setNum(temp);
    };

    return (
        <div id={labelName + 'Div'} className="tooltip">
            <input
                id={labelName + 'Range'}
                type="range"
                value={val}
                min={min}
                max={max}
                step={step}
                onChange={handleRangeChange}
            ></input>
            <input
                id={labelName + 'Number'}
                value={num}
                type="text"
                onChange={handleNumChange}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        handleNumSubmit();
                    }
                }}
            ></input>
            <span id={labelName + 'Span'} className="tooltiptext">
                {tooltipText}
            </span>
        </div>
    );
}

export default Slider;
