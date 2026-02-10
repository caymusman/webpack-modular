import React from 'react';
import Slider from '../ui/Slider';

class Delay extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            audio: this.props.audioContext.createDelay(5.0),
        };

        this.handleDelayTime = this.handleDelayTime.bind(this);
    }

    handleDelayTime(val) {
        this.state.audio.delayTime.setValueAtTime(val, this.props.audioContext.currentTime);
    }

    componentDidMount() {
        this.props.createAudio(this.state.audio);
    }

    render() {
        return (
            <div id="delayDiv">
                <Slider
                    labelName="delayDelayTime"
                    tooltipText="Delay Time (s)"
                    min={0}
                    max={5}
                    step={0.01}
                    setAudio={this.handleDelayTime}
                ></Slider>
            </div>
        );
    }
}

export default Delay;
