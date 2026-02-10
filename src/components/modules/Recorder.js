import React from 'react';

class Recorder extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            audio: this.props.audioContext.createGain(),
            destination: this.props.audioContext.createMediaStreamDestination(),
            mediaRecorder: null,
            playing: false,
            finished: false,
            href: null,
        };

        this.handlePlay = this.handlePlay.bind(this);
        this.handleFinish = this.handleFinish.bind(this);
    }

    handlePlay() {
        if (this.state.playing) {
            this.state.audio.gain.setTargetAtTime(0, this.props.audioContext.currentTime + 0.02, 0.02);
            setTimeout(() => {
                this.state.mediaRecorder.stop();
                this.setState({
                    playing: false,
                });
            }, 100);
        } else {
            this.state.audio.gain.setTargetAtTime(1, this.props.audioContext.currentTime + 0.04, 0.04);
            this.state.mediaRecorder.start();
            this.setState({
                playing: true,
                finished: false,
            });
        }
    }

    handleFinish() {
        this.state.audio.gain.setTargetAtTime(0, this.props.audioContext.currentTime + 0.02, 0.02);
        setTimeout(() => {
            this.state.mediaRecorder.stop();
        }, 100);
        if (!this.state.finished) {
            setTimeout(() => {
                const blob = new Blob(this.chunks, { type: 'audio/ogg' });
                this.setState({
                    href: URL.createObjectURL(blob),
                    playing: false,
                    finished: true,
                });
            }, 510);
        }
    }

    componentDidMount() {
        this.state.audio.connect(this.state.destination);
        this.state.audio.gain.setValueAtTime(0, this.props.audioContext.currentTime);
        const mr = new MediaRecorder(this.state.destination.stream, { mimeType: 'audio/ogg' });
        mr.audioChannels = 2;
        this.chunks = [];
        mr.ondataavailable = (event) => {
            this.chunks.push(event.data);
        };
        this.setState({
            mediaRecorder: mr,
        });
        this.props.createAudio(this.state.audio);
    }

    render() {
        return (
            <div id="RecorderDiv">
                <div id="recorderButtons">
                    <button id="recorderPlay" onClick={this.handlePlay}>
                        {this.state.playing ? 'Pause' : 'Record'}
                    </button>
                    <button id="recorderFinish" onClick={this.handleFinish}>
                        Finish
                    </button>
                </div>
                <a href={this.state.href} download="recordedAudio.ogg">
                    {' '}
                    Download Here
                </a>
            </div>
        );
    }
}

export default Recorder;
