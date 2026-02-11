import { useRef, useState, useEffect } from 'react';

function Output({ handleOutput, audioContext }) {
    const gainNode = useRef(audioContext.createGain());
    const [value, setValue] = useState(0.5);

    useEffect(() => {
        gainNode.current.connect(audioContext.destination);
    }, [audioContext]);

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
            tomyKey: 'Output',
            toLocation: { x: xCenter, y: yCenter },
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
                ></input>
            </div>
            <div className="cordOuter" onClick={onOutput}>
                <div className="cordInner" id={'Output' + 'inputInner'}></div>
            </div>
        </div>
    );
}

export default Output;
