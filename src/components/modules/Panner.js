import { useRef, useEffect } from 'react';
import Slider from '../ui/Slider';
import { setPanValue } from '../../audio/nodeHelpers';
import { createPannerNode } from '../../audio/nodeFactories';
import { useAudioContext } from '../../audio/AudioContextProvider';

function Panner({ createAudio }) {
    const audioContext = useAudioContext();
    const audio = useRef(createPannerNode(audioContext));

    useEffect(() => {
        createAudio(audio.current);
    }, [createAudio]);

    const handlePan = (val) => {
        setPanValue(audio.current, val);
    };

    return (
        <div>
            <Slider labelName="panPan" tooltipText="Pan" min={-1} max={1} step={0.001} setAudio={handlePan}></Slider>
        </div>
    );
}

export default Panner;
