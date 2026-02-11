import { useRef, useEffect } from 'react';
import Selector from '../ui/Selector';
import Dial from '../ui/Dial';
import Slider from '../ui/Slider';
import LogSlider from '../ui/LogSlider';

function Filter({ audioContext, createAudio }) {
    const audio = useRef(audioContext.createBiquadFilter());
    useEffect(() => {
        createAudio(audio.current);
    }, [createAudio]);

    const handleFilterType = (val) => {
        audio.current.type = val;
    };

    const setGain = (val) => {
        audio.current.gain.setValueAtTime(val, audioContext.currentTime);
    };

    const setFreq = (val) => {
        audio.current.frequency.value = val;
    };

    const handleDialChange = (val) => {
        audio.current.Q.value = val;
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
