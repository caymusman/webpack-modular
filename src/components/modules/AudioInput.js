import React from 'react';
import Slider from '../ui/Slider';

class AudioInput extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            outputGain: this.props.audioContext.createGain(),
        };

        this.setGain = this.setGain.bind(this);
    }

    setGain(val) {
        this.state.outputGain.gain.setValueAtTime(val, this.props.audioContext.currentTime);
    }

    componentDidMount() {
        if (navigator.mediaDevices) {
            navigator.mediaDevices
                .getUserMedia({ audio: true })
                .then((stream) => {
                    this.mediaStream = stream;
                    const audio = this.props.audioContext.createMediaStreamSource(stream);
                    audio.connect(this.state.outputGain);
                    this.state.outputGain.gain.setValueAtTime(0.5, this.props.audioContext.currentTime);
                    this.props.createAudio(this.state.outputGain);
                })
                .catch((err) => {
                    console.warn('When setting up media devices, I caught: \n' + err); // eslint-disable-line no-console
                    this.props.handleClose();
                    this.props.alert('You denied audio permissions. Allow permissions to create this module.');
                });
        } else {
            console.warn('Media Devices are not supported!'); // eslint-disable-line no-console
            this.props.handleClose();
            this.props.alert('Media Devices are not supported.');
        }
    }

    componentWillUnmount() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach((track) => track.stop());
        }
        this.state.outputGain.disconnect();
    }

    render() {
        return (
            <Slider
                labelName="audioInGain"
                tooltipText="Gain"
                min={0}
                max={1}
                step={0.01}
                mid={0.5}
                setAudio={this.setGain}
            />
        );
    }
}

export default AudioInput;
