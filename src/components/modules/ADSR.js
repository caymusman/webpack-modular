import React from 'react';
import LogSlider from '../ui/LogSlider';
import TextInput from '../ui/TextInput';

class ADSR extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            audio: this.props.audioContext.createGain(),
            rate: 3000,
            interval: null,
            running: false,
            attack: 0.2,
            decay: 0.2,
            sustain: 0.6,
            release: 0.3,
        };
        this.handleSlider = this.handleSlider.bind(this);
        this.handleToggle = this.handleToggle.bind(this);
        this.handleAudio = this.handleAudio.bind(this);
        this.handleTextSubmit = this.handleTextSubmit.bind(this);
    }

    handleSlider(val) {
        this.setState({
            rate: (1 / val) * 1000,
        });

        if (this.state.running) {
            clearInterval(this.state.interval);
            this.setState({
                interval: setInterval(this.handleAudio, (1 / val) * 1000),
            });
        }
    }

    handleToggle() {
        const current = this.props.audioContext.currentTime;
        if (!this.state.running) {
            this.setState({
                running: true,
                interval: setInterval(this.handleAudio, this.state.rate),
            });
        } else {
            this.state.audio.gain.setTargetAtTime(0, current + this.state.release, 0.5);
            clearInterval(this.state.interval);
            this.setState({
                running: false,
            });
        }
    }

    handleAudio() {
        const current = this.props.audioContext.currentTime;
        this.state.audio.gain.cancelScheduledValues(current);
        this.state.audio.gain.setTargetAtTime(0.9, current + this.state.attack, this.state.attack);
        this.state.audio.gain.setTargetAtTime(
            this.state.sustain,
            current + this.state.attack + this.state.decay,
            this.state.decay
        );
        this.state.audio.gain.setTargetAtTime(
            0.001,
            current + this.state.attack + +this.state.decay + this.state.release,
            this.state.release
        );
    }

    handleTextSubmit(name, num) {
        switch (name) {
            case 'Attack':
                this.setState({ attack: num });
                break;
            case 'Decay':
                this.setState({ decay: num });
                break;
            case 'Sustain':
                this.setState({ sustain: num });
                break;
            case 'Release':
                this.setState({ release: num });
                break;
            default:
                return;
        }
    }

    componentDidMount() {
        this.props.createAudio(this.state.audio);
        this.state.audio.gain.setValueAtTime(0, this.props.audioContext.currentTime);
    }

    componentWillUnmount() {
        if (this.state.interval) {
            clearInterval(this.state.interval);
        }
        this.state.audio.disconnect();
    }

    render() {
        return (
            <div id="ADSRDiv">
                <LogSlider
                    labelName="ADSRSlider"
                    tooltipText="LFO Rate"
                    min={0}
                    max={21}
                    mid={10}
                    onChange={this.handleSlider}
                ></LogSlider>
                <div id="ADSRBox">
                    <label id="ADSRCheck" className="switch tooltip">
                        <input type="checkbox" onClick={this.handleToggle}></input>
                        <span className="slider round"></span>
                        <span id="ADSRCheckTip" className="tooltiptext">
                            LFO Mode
                        </span>
                    </label>
                    <button id="ADSRButton" onClick={this.handleAudio}>
                        Pulse
                    </button>
                </div>
                <div id="ADSRControls">
                    <TextInput
                        labelName="ADSRAttack"
                        tooltipText="Attack"
                        min={0}
                        max={5}
                        defaultVal={0.2}
                        onSubmit={this.handleTextSubmit}
                    ></TextInput>
                    <TextInput
                        labelName="ADSRDecay"
                        tooltipText="Decay"
                        min={0}
                        max={5}
                        defaultVal={0.2}
                        onSubmit={this.handleTextSubmit}
                    ></TextInput>
                    <TextInput
                        labelName="ADSRSustain"
                        tooltipText="Sustain"
                        min={0}
                        max={1}
                        defaultVal={0.5}
                        onSubmit={this.handleTextSubmit}
                    ></TextInput>
                    <TextInput
                        labelName="ADSRRelease"
                        tooltipText="Release"
                        min={0}
                        max={5}
                        defaultVal={0.3}
                        onSubmit={this.handleTextSubmit}
                    ></TextInput>
                </div>
            </div>
        );
    }
}

export default ADSR;
