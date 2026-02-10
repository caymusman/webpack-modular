import React from 'react';
import Selector from '../ui/Selector';
import Dial from '../ui/Dial';
import Slider from '../ui/Slider';
import LogSlider from '../ui/LogSlider';

class Filter extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            audio: this.props.audioContext.createBiquadFilter(),
            type: 'lowpass',
        };

        this.handleFilterType = this.handleFilterType.bind(this);
        this.setGain = this.setGain.bind(this);
        this.setFreq = this.setFreq.bind(this);
        this.handleDialChange = this.handleDialChange.bind(this);
    }

    handleFilterType(val) {
        this.state.audio.type = val;
        this.setState({
            type: val,
        });
    }

    setGain(val) {
        this.state.audio.gain.setValueAtTime(val, this.props.audioContext.currentTime);
    }

    setFreq(val) {
        this.state.audio.frequency.value = val;
    }

    handleDialChange(val) {
        this.state.audio.Q.value = val;
    }

    componentDidMount() {
        this.props.createAudio(this.state.audio);
    }

    render() {
        const filterTypes = ['lowpass', 'highpass', 'bandpass', 'lowshelf', 'highshelf', 'peaking', 'notch', 'allpass'];
        return (
            <div className="filterDiv">
                <div id="filterBoxOne">
                    <Selector id="filterSelector" values={filterTypes} handleClick={this.handleFilterType} />
                    <Dial min={0} max={1001} name="Q" onChange={this.handleDialChange} />
                </div>
                <Slider
                    labelName="filterGain"
                    tooltipText="Filter Gain"
                    min={-40}
                    max={40}
                    step={0.01}
                    setAudio={this.setGain}
                />
                <LogSlider
                    labelName="filterFreq"
                    tooltipText="Filter Frequency"
                    min={0}
                    max={20001}
                    mid={440}
                    onChange={this.setFreq}
                />
            </div>
        );
    }
}

export default Filter;
