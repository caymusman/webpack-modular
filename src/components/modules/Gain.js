import React from 'react';

class Gain extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            audio: this.props.audioContext.createGain(),
            value: 0.5,
            num: 0.5,
            max: 1,
            min: 0,
        };

        this.handleGainChange = this.handleGainChange.bind(this);
        this.handleNumChange = this.handleNumChange.bind(this);
        this.handleNumGainChange = this.handleNumGainChange.bind(this);
        this.handleOutput = this.handleOutput.bind(this);
    }

    handleGainChange(event) {
        let gainVal = event.target.value;
        if (gainVal > 1) {
            gainVal = 1;
        } else if (gainVal < 0) {
            gainVal = 0;
        }
        this.state.audio.gain.setValueAtTime(gainVal, this.props.audioContext.currentTime);
        this.setState({
            value: gainVal,
            num: gainVal,
        });
    }

    handleNumChange(event) {
        if (isNaN(event.target.value)) {
            return;
        }
        this.setState({
            num: event.target.value,
        });
    }

    handleNumGainChange() {
        let temp = this.state.num;
        if (temp > this.state.max) {
            temp = this.state.max;
        } else if (temp < this.state.min) {
            temp = this.state.min;
        }
        this.setState({
            value: temp,
            num: temp,
        });
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
            audio: this.state.audio.gain,
        });
    }

    componentDidMount() {
        this.props.createAudio(this.state.audio);
        this.state.audio.gain.setValueAtTime(0.5, this.props.audioContext.currentTime);
    }

    render() {
        return (
            <div className="gainDiv">
                <input
                    id="gainRangeInput"
                    type="range"
                    value={this.state.value}
                    min="0"
                    max="1"
                    step=".01"
                    onChange={this.handleGainChange}
                ></input>
                <input
                    id="gainNumInput"
                    value={this.state.num}
                    type="text"
                    onChange={this.handleNumChange}
                    onKeyPress={(event) => {
                        if (event.key === 'Enter') {
                            this.handleNumGainChange();
                        }
                    }}
                ></input>

                <div className="cordOuter tooltip" id="firstParam" onClick={this.handleOutput}>
                    <div className="cordInner" id={this.props.parent + ' param' + ' inputInner'}>
                        <span id="gainGainParamTip" className="tooltiptext">
                            <span className="paramSpan">param: </span>gain
                        </span>
                    </div>
                </div>
            </div>
        );
    }
}

export default Gain;
