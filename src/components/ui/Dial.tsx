import { ChangeEvent, useState } from 'react';

interface DialProps {
    name: string;
    min: number;
    max: number;
    onChange: (val: number) => void;
}

function Dial({ name, min, max, onChange }: DialProps) {
    const [value, setValue] = useState<string | number>(0);
    const [num, setNum] = useState<string | number>(0);
    const [rotPercent, setRotPercent] = useState(0);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);
        setNum(Number((Math.pow(max, Number(event.target.value)) - 1).toFixed(2)));
        setRotPercent(Number(event.target.value) * 180);
        onChange(Math.pow(max, Number(event.target.value)) - 1);
    };

    const handleNumChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (isNaN(Number(event.target.value)) && event.target.value !== '0.') {
            return;
        }
        setNum(event.target.value);
    };

    const handleNumSubmit = () => {
        let temp: number = Number(num);
        if (temp > max - 1) {
            temp = max - 1;
        } else if (temp < min) {
            temp = min;
        }
        setValue(Math.log(temp) / Math.log(max));
        setNum(Number(temp.toFixed(2)));
        setRotPercent((Math.log(temp) / Math.log(max)) * 180);
    };

    const rotStyle = {
        background: `conic-gradient(from ${rotPercent / Number.POSITIVE_INFINITY - 90}deg, #fff, #555)`,
        transform: `rotate(${rotPercent}deg)`,
    };

    return (
        <div className="dialWhole">
            <div id="dialKnob" className="tooltip">
                <span id={name + 'dialtip'} className="tooltiptext">
                    {name}
                </span>
                <input
                    className="dialRange"
                    value={value}
                    type="range"
                    min="0"
                    max="1"
                    step=".001"
                    onChange={handleChange}
                    aria-label={name}
                ></input>
                <div id="dialEmpty" style={rotStyle}></div>
            </div>
            <input
                id="dialNumInput"
                value={num}
                type="text"
                onChange={handleNumChange}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        handleNumSubmit();
                    }
                }}
                aria-label={name + ' value'}
            ></input>
        </div>
    );
}

export default Dial;
