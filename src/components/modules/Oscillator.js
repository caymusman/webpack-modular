import React from 'react';
import Selector from '../ui/Selector';
import LogSlider from '../ui/LogSlider';
import Slider from '../ui/Slider';

//Oscillator Module
class Oscillator extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            audio: this.props.audioContext.createOscillator(),
            wave: 'sine',
            min: 20,
            max: 20001,
            mid: 440,
            LFO: false,
            modulatorGain: this.props.audioContext.createGain(),
        };

        this.setFreq = this.setFreq.bind(this);
        this.handleWaveChange = this.handleWaveChange.bind(this);
        this.handleLFOClick = this.handleLFOClick.bind(this);
        this.handleOutput = this.handleOutput.bind(this);
        this.setModDepth = this.setModDepth.bind(this);
    }

    setFreq(val) {
        this.state.audio.frequency.setValueAtTime(Number(val), this.props.audioContext.currentTime);
    }

    handleWaveChange(wave) {
        this.state.audio.type = wave;
        this.setState({
            wave: wave,
        });
    }

    handleLFOClick() {
        if (this.state.LFO) {
            this.setState({
                max: 20001,
                min: 20,
                mid: 440,
                LFO: false,
            });
            this.state.audio.frequency.setValueAtTime(440, this.props.audioContext.currentTime);
        } else {
            this.setState({
                max: 21,
                min: 0,
                mid: 10,
                LFO: true,
            });
            this.state.audio.frequency.setValueAtTime(10, this.props.audioContext.currentTime);
        }
    }

    handleOutput(event) {
        const largerDim = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth;
        const el = event.target.getBoundingClientRect();
        const x = el.x;
        const y = el.y;
        const bottom = el.bottom;
        const right = el.right;
        const xCenter = (right - x) / 2 + x - largerDim * 0.04;
        const yCenter = (bottom - y) / 2 + y - largerDim * 0.04;

        this.props.handleOutput({
            tomyKey: this.props.parent + ' param',
            toLocation: { x: xCenter, y: yCenter },
            audio: this.state.modulatorGain,
        });
    }

    setModDepth(val) {
        this.state.modulatorGain.gain.setValueAtTime(val, this.props.audioContext.currentTime);
    }

    componentDidMount() {
        this.props.createAudio(this.state.audio);
        this.state.audio.frequency.setValueAtTime(this.state.mid, this.props.audioContext.currentTime);
        this.state.modulatorGain.connect(this.state.audio.frequency);
        this.state.audio.start();
    }

    componentWillUnmount() {
        try {
            this.state.audio.stop();
        } catch (_e) {
            /* oscillator may already be stopped */
        }
        this.state.audio.disconnect();
        this.state.modulatorGain.disconnect();
    }

    render() {
        return (
            <div className="oscDiv">
                <div id="oscBoxOne">
                    <Selector
                        id="waveSelector"
                        values={['sine', 'sawtooth', 'triangle']}
                        handleClick={this.handleWaveChange}
                    />
                    <label id="oscSlider" className="switch tooltip">
                        <input type="checkbox" onClick={this.handleLFOClick}></input>
                        <span className="slider round"></span>
                        <span id="oscLFOTip" className="tooltiptext">
                            LFO Mode
                        </span>
                    </label>
                </div>
                <LogSlider
                    labelName="oscFreq"
                    tooltipText="Oscillator Frequency"
                    min={this.state.min}
                    max={this.state.max}
                    mid={this.state.mid}
                    onChange={this.setFreq}
                />
                <div className="cordOuter tooltip" id="firstParam" onClick={this.handleOutput}>
                    <div className="cordInner" id={this.props.parent + ' param' + ' inputInner'}>
                        <div id="ttWrapper">
                            <span id="oscDetuneParamTip" className="tooltiptext">
                                <span className="paramSpan">param: </span>frequency
                            </span>
                        </div>
                    </div>
                </div>
                <Slider
                    labelName="oscModGain"
                    tooltipText="Mod Depth"
                    min={0}
                    max={300}
                    mid={150}
                    setAudio={this.setModDepth}
                />
            </div>
        );
    }
}

export default Oscillator;
