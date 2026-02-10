import React from 'react';

class Output extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            gainNode: this.props.audioContext.createGain(),
            value: 0.5,
        };
        this.handleOutput = this.handleOutput.bind(this);
        this.handleChange = this.handleChange.bind(this);
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
            tomyKey: 'Output',
            toLocation: { x: xCenter, y: yCenter },
            audio: this.state.gainNode,
        });
    }

    handleChange(event) {
        this.state.gainNode.gain.setValueAtTime(event.target.value, this.props.audioContext.currentTime);
        this.setState({
            value: event.target.value,
        });
    }

    componentDidMount() {
        this.state.gainNode.connect(this.props.audioContext.destination);
    }

    render() {
        return (
            <div id="outputDiv">
                <p>Output</p>
                <div id="outputCenter">
                    <input
                        id="gainSlider"
                        value={this.state.value}
                        type="range"
                        min="0"
                        max="1"
                        step=".05"
                        onChange={this.handleChange}
                    ></input>
                </div>
                <div className="cordOuter" onClick={this.handleOutput}>
                    <div className="cordInner" id={'Output' + 'inputInner'}></div>
                </div>
            </div>
        );
    }
}

export default Output;
