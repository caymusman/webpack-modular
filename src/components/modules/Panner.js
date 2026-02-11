import { useRef, useEffect } from 'react';
import Slider from '../ui/Slider';

function Panner({ audioContext, createAudio }) {
    const audio = useRef(audioContext.createStereoPanner());

    useEffect(() => {
        createAudio(audio.current);
    }, [createAudio]);

    const handlePan = (val) => {
        audio.current.pan.value = val;
    };

    return (
        <div>
            <Slider labelName="panPan" tooltipText="Pan" min={-1} max={1} step={0.001} setAudio={handlePan}></Slider>
        </div>
    );
}

export default Panner;
