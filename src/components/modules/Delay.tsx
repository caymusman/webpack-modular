import { useRef, useEffect } from 'react';
import Slider from '../ui/Slider';
import { createDelayNode } from '../../audio/nodeFactories';
import { useAudioContext } from '../../audio/AudioContextProvider';

interface DelayProps {
    createAudio: (node: AudioNode) => void;
}

function Delay({ createAudio }: DelayProps) {
    const audioContext = useAudioContext();
    const audio = useRef(createDelayNode(audioContext, 5.0));

    useEffect(() => {
        createAudio(audio.current);
    }, [createAudio]);

    const handleDelayTime = (val: number) => {
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
