import { useRef, useEffect } from 'react';
import Slider from '../ui/Slider';
import { setPanValue } from '../../audio/nodeHelpers';
import { createPannerNode } from '../../audio/nodeFactories';
import { useAudioContext } from '../../audio/AudioContextProvider';

interface PannerProps {
    createAudio: (node: AudioNode) => void;
}

function Panner({ createAudio }: PannerProps) {
    const audioContext = useAudioContext();
    const audio = useRef(createPannerNode(audioContext));

    useEffect(() => {
        createAudio(audio.current);
    }, [createAudio]);

    const handlePan = (val: number) => {
        setPanValue(audio.current, val);
    };

    return (
        <div>
            <Slider labelName="panPan" tooltipText="Pan" min={-1} max={1} step={0.001} setAudio={handlePan}></Slider>
        </div>
    );
}

export default Panner;
