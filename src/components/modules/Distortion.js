import React from 'react';
import Slider from '../ui/Slider';
import Selector from '../ui/Selector';

class Distortion extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            audio: this.props.audioContext.createWaveShaper(),
        };

        this.handleCurve = this.handleCurve.bind(this);
        this.makeCurve = this.makeCurve.bind(this);
        this.handleOversample = this.handleOversample.bind(this);
    }

    makeCurve(num) {
        const temp = num;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        let x;
        for (let i = 0; i < n_samples; ++i) {
            x = (i * 2) / n_samples - 1;
            curve[i] = ((3 + temp) * x * 20 * deg) / (Math.PI + temp * Math.abs(x));
        }
        return curve;
    }

    handleCurve(val) {
        this.state.audio.curve = this.makeCurve(val);
    }

    handleOversample(val) {
        this.state.audio.oversample = val;
    }

    componentDidMount() {
        this.props.createAudio(this.state.audio);
    }

    render() {
        return (
            <div>
                <Slider
                    labelName="distortionCurve"
                    tooltipText="Distortion Curve"
                    min={50}
                    max={800}
                    step={0.1}
                    setAudio={this.handleCurve}
                ></Slider>
                <Selector id="distortionSelector" values={['none', '2x', '4x']} handleClick={this.handleOversample} />
            </div>
        );
    }
}

export default Distortion;
