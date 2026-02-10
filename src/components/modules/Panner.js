import React from 'react';
import Slider from '../ui/Slider';

class Panner extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            audio: this.props.audioContext.createStereoPanner(),
            val: 0,
        };

        this.handlePan = this.handlePan.bind(this);
    }

    handlePan(val) {
        this.state.audio.pan.value = val;
    }

    componentDidMount() {
        this.props.createAudio(this.state.audio);
    }

    render() {
        return (
            <div>
                <Slider
                    labelName="panPan"
                    tooltipText="Pan"
                    min={-1}
                    max={1}
                    step={0.001}
                    setAudio={this.handlePan}
                ></Slider>
            </div>
        );
    }
}

export default Panner;
