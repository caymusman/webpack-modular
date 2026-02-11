import { useRef, useEffect } from 'react';
import Slider from '../ui/Slider';
import Selector from '../ui/Selector';

function Distortion({ audioContext, createAudio }) {
    const audio = useRef(audioContext.createWaveShaper());

    useEffect(() => {
        createAudio(audio.current);
    }, [createAudio]);

    const makeCurve = (num) => {
        const temp = num;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        let x;
        for (let i = 0; i < n_samples; ++i) {
            x = (i * 2) / n_samples - 1;
            curve[i] = ((3 + temp) * x * 20 * deg) / (Math.PI + temp * Math.abs(x));
        }
        return curve;
    };

    const handleCurve = (val) => {
        audio.current.curve = makeCurve(val);
    };

    const handleOversample = (val) => {
        audio.current.oversample = val;
    };

    return (
        <div>
            <Slider
                labelName="distortionCurve"
                tooltipText="Distortion Curve"
                min={50}
                max={800}
                step={0.1}
                setAudio={handleCurve}
            ></Slider>
            <Selector id="distortionSelector" values={['none', '2x', '4x']} handleClick={handleOversample} />
        </div>
    );
}

export default Distortion;
