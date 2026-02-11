import { useState } from 'react';

function LogSlider({ labelName, tooltipText, min, max, mid, onChange }) {
    const [val, setVal] = useState(Number(Math.log(mid) / Math.log(max)));
    const [num, setNum] = useState(mid);
    const [prevMid, setPrevMid] = useState(mid);

    // Adjust state when mid prop changes (React-recommended pattern)
    if (mid !== prevMid) {
        setPrevMid(mid);
        setVal(Number(Math.log(mid) / Math.log(max)));
        setNum(mid);
    }

    const handleChange = (event) => {
        setVal(event.target.value);
        setNum(Number((Math.pow(max, event.target.value) - 1).toFixed(2)));
        onChange(Number((Math.pow(max, event.target.value) - 1).toFixed(2)));
    };

    const handleNumChange = (event) => {
        if (isNaN(event.target.value) && event.target.value !== '0.') {
            return;
        }
        setNum(event.target.value);
    };

    const handleNumFreqChange = () => {
        let temp = num;
        if (temp > max - 1) {
            temp = max - 1;
        } else if (temp < min) {
            temp = min;
        }
        setVal(Math.log(Number(temp) + 1) / Math.log(max - 1));
        setNum(Number(Number(temp).toFixed(2)));
        onChange(Number(Number(temp).toFixed(2)));
    };

    return (
        <div id={labelName + 'logSliderWhole'} className="tooltip">
            <input
                className={labelName + 'freqNumRange'}
                value={val}
                type="range"
                min={Number(Math.log(min + 1) / Math.log(max))}
                max={1}
                step="any"
                onChange={handleChange}
                aria-label={tooltipText}
            ></input>
            <input
                id={labelName + 'freqNumInput'}
                value={num}
                type="text"
                onChange={handleNumChange}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        handleNumFreqChange();
                    }
                }}
                aria-label={tooltipText + ' value'}
            ></input>
            <span id={labelName + 'logSliderFreqTip'} className="tooltiptext">
                {tooltipText}
            </span>
        </div>
    );
}

export default LogSlider;
