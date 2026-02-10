import React from 'react';

class Dial extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            value: 0,
            num: 0,
            rotPercent: 0,
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleNumChange = this.handleNumChange.bind(this);
        this.handleNumSubmit = this.handleNumSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({
            value: event.target.value,
            num: Number((Math.pow(this.props.max, event.target.value) - 1).toFixed(2)),
            rotPercent: event.target.value * 180,
        });
        this.props.onChange(Math.pow(this.props.max, event.target.value) - 1);
    }

    handleNumChange(event) {
        if (isNaN(event.target.value) && event.target.value !== '0.') {
            return;
        }
        this.setState({
            num: event.target.value,
        });
    }

    handleNumSubmit() {
        let temp = this.state.num;
        if (temp > this.props.max - 1) {
            temp = this.props.max - 1;
        } else if (temp < this.props.min) {
            temp = this.props.min;
        }
        this.setState({
            val: Math.log(temp) / Math.log(this.props.max),
            num: Number(Number(temp).toFixed(2)),
            rotPercent: (Math.log(temp) / Math.log(this.props.max)) * 180,
        });
    }

    render() {
        const rotStyle = {
            background: `conic-gradient(from ${this.state.rotPercent / Number.POSITIVE_INFINITY - 90}deg, #fff, #555)`,
            transform: `rotate(${this.state.rotPercent}deg)`,
        };

        return (
            <div className="dialWhole">
                <div id="dialKnob" className="tooltip">
                    <span id={this.props.name + 'dialtip'} className="tooltiptext">
                        {this.props.name}
                    </span>
                    <input
                        className="dialRange"
                        value={this.state.value}
                        type="range"
                        min="0"
                        max="1"
                        step=".001"
                        onChange={this.handleChange}
                    ></input>
                    <div id="dialEmpty" style={rotStyle}></div>
                </div>
                <input
                    id="dialNumInput"
                    value={this.state.num}
                    type="text"
                    onChange={this.handleNumChange}
                    onKeyPress={(event) => {
                        if (event.key === 'Enter') {
                            this.handleNumSubmit();
                        }
                    }}
                ></input>
            </div>
        );
    }
}

export default Dial;
