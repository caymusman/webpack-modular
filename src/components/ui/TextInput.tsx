import { ChangeEvent, useState } from 'react';

interface TextInputProps {
    defaultVal: number;
    max: number;
    min: number;
    onSubmit: (name: string, val: number) => void;
    tooltipText: string;
    labelName: string;
}

function TextInput({ defaultVal, max, min, onSubmit, tooltipText, labelName }: TextInputProps) {
    const [val, setVal] = useState<string | number>(defaultVal);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (isNaN(Number(event.target.value)) && event.target.value !== '0.') {
            return;
        }
        setVal(event.target.value);
    };

    const handleNumSubmit = () => {
        let temp: number = Number(val);
        if (temp > max) {
            temp = max;
            setVal(max);
        } else if (temp < min) {
            temp = min;
            setVal(min);
        }
        onSubmit(tooltipText, temp);
    };

    return (
        <label id={labelName + 'inputLabel'} className="tooltip">
            <input
                value={val}
                type="text"
                onChange={handleChange}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        handleNumSubmit();
                    }
                }}
                aria-label={tooltipText}
            ></input>
            <span className="tooltiptext">
                {tooltipText}
            </span>
        </label>
    );
}

export default TextInput;
