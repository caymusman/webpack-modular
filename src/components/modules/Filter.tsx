import { useRef, useEffect } from 'react';
import Selector from '../ui/Selector';
import Dial from '../ui/Dial';
import Slider from '../ui/Slider';
import LogSlider from '../ui/LogSlider';
import { setNodeType, setParamValue } from '../../audio/nodeHelpers';
import { createFilterNode } from '../../audio/nodeFactories';
import { useAudioContext } from '../../audio/AudioContextProvider';

interface FilterProps {
    createAudio: (node: AudioNode) => void;
}

function Filter({ createAudio }: FilterProps) {
    const audioContext = useAudioContext();
    const audio = useRef(createFilterNode(audioContext));
    useEffect(() => {
        createAudio(audio.current);
    }, [createAudio]);

    const handleFilterType = (val: string) => {
        setNodeType(audio.current, val);
    };

    const setGain = (val: number) => {
        setParamValue(audio.current.gain, val, audioContext.currentTime);
    };

    const setFreq = (val: number) => {
        setParamValue(audio.current.frequency, Number(val), audioContext.currentTime);
    };

    const handleDialChange = (val: number) => {
        setParamValue(audio.current.Q, Number(val), audioContext.currentTime);
    };

    const filterTypes = ['lowpass', 'highpass', 'bandpass', 'lowshelf', 'highshelf', 'peaking', 'notch', 'allpass'];
    return (
        <div className="filterDiv">
            <div id="filterBoxOne">
                <Selector id="filterSelector" values={filterTypes} handleClick={handleFilterType} />
                <Dial min={0} max={1001} name="Q" onChange={handleDialChange} />
            </div>
            <Slider
                labelName="filterGain"
                tooltipText="Filter Gain"
                min={-40}
                max={40}
                step={0.01}
                setAudio={setGain}
            />
            <LogSlider
                labelName="filterFreq"
                tooltipText="Filter Frequency"
                min={0}
                max={20001}
                mid={440}
                onChange={setFreq}
            />
        </div>
    );
}

export default Filter;
