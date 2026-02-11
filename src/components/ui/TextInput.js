import { useState } from 'react';

function TextInput({ defaultVal, max, min, onSubmit, tooltipText, labelName }) {
    const [val, setVal] = useState(defaultVal);

    const handleChange = (event) => {
        if (isNaN(event.target.value) && event.target.value !== '0.') {
            return;
        }
        setVal(event.target.value);
    };

    const handleNumSubmit = () => {
        let temp = val;
        if (temp > max) {
            temp = max;
            setVal(max);
        } else if (temp < min) {
            temp = min;
            setVal(min);
        }
        onSubmit(tooltipText, Number(temp));
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
            ></input>
            <span id={labelName + 'Tip'} className="tooltiptext">
                {tooltipText}
            </span>
        </label>
    );
}

export default TextInput;
