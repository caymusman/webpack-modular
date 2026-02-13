import { ChangeEvent, useState } from 'react';

interface SliderProps {
    labelName: string;
    tooltipText: string;
    min: number;
    max: number;
    step: number;
    setAudio: (val: number) => void;
}

function Slider({ labelName, tooltipText, min, max, step, setAudio }: SliderProps) {
    const [num, setNum] = useState<string | number>((max + min) / 2);
    const [val, setVal] = useState<string | number>((max + min) / 2);

    const handleRangeChange = (event: ChangeEvent<HTMLInputElement>) => {
        let v: number = Number(event.target.value);
        if (v > max) {
            v = max;
        } else if (v < min) {
            v = min;
        }
        setAudio(v);
        setVal(v);
        setNum(v);
    };

    const handleNumChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (isNaN(Number(event.target.value)) && event.target.value !== '-') {
            return;
        }
        setNum(event.target.value);
    };

    const handleNumSubmit = () => {
        let temp: number = Number(num);
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
                aria-label={tooltipText}
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
                aria-label={tooltipText + ' value'}
            ></input>
            <span className="tooltiptext">
                {tooltipText}
            </span>
        </div>
    );
}

export default Slider;
