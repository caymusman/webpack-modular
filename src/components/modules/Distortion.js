import { useRef, useEffect } from 'react';
import Slider from '../ui/Slider';
import Selector from '../ui/Selector';
import { setDistortionCurve, setOversample, makeDistortionCurve } from '../../audio/nodeHelpers';
import { createWaveShaperNode } from '../../audio/nodeFactories';
import { useAudioContext } from '../../audio/AudioContextProvider';

function Distortion({ createAudio }) {
    const audioContext = useAudioContext();
    const audio = useRef(createWaveShaperNode(audioContext));

    useEffect(() => {
        createAudio(audio.current);
    }, [createAudio]);

    const handleCurve = (val) => {
        setDistortionCurve(audio.current, makeDistortionCurve(val));
    };

    const handleOversample = (val) => {
        setOversample(audio.current, val);
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
