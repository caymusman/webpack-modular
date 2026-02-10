import React from 'react';
import Selector from '../ui/Selector';

class Reverb extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            audio: this.props.audioContext.createConvolver(),
        };

        this.updateBuffer = this.updateBuffer.bind(this);
        this.handleSelector = this.handleSelector.bind(this);
    }

    updateBuffer(path) {
        fetch(path)
            .then((res) => res.arrayBuffer())
            .then((buffer) => this.props.audioContext.decodeAudioData(buffer))
            .then((final) => (this.state.audio.buffer = final));
    }

    handleSelector(value) {
        switch (value) {
            case 'Small':
                this.updateBuffer('media/short.wav');
                break;
            case 'Medium':
                this.updateBuffer('media/medium.wav');
                break;
            case 'Large':
                this.updateBuffer('media/long.wav');
                break;
        }
    }

    componentDidMount() {
        this.updateBuffer('media/short.wav');
        this.props.createAudio(this.state.audio);
    }

    render() {
        return (
            <div id="reverbDiv">
                <Selector id="reverbSelector" values={['Small', 'Medium', 'Large']} handleClick={this.handleSelector} />
            </div>
        );
    }
}

export default Reverb;
