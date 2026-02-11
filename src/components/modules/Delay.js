import { useRef, useEffect } from 'react';
import Slider from '../ui/Slider';

function Delay({ audioContext, createAudio }) {
    const audio = useRef(audioContext.createDelay(5.0));

    useEffect(() => {
        createAudio(audio.current);
    }, [createAudio]);

    const handleDelayTime = (val) => {
        audio.current.delayTime.setValueAtTime(val, audioContext.currentTime);
    };

    return (
        <div id="delayDiv">
            <Slider
                labelName="delayDelayTime"
                tooltipText="Delay Time (s)"
                min={0}
                max={5}
                step={0.01}
                setAudio={handleDelayTime}
            ></Slider>
        </div>
    );
}

export default Delay;
