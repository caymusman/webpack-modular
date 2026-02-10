import React from 'react';

class Slider extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            num: (this.props.max + this.props.min) / 2,
            val: (this.props.max + this.props.min) / 2,
        };

        this.handleRangeChange = this.handleRangeChange.bind(this);
        this.handleNumChange = this.handleNumChange.bind(this);
        this.handleNumSubmit = this.handleNumSubmit.bind(this);
    }

    handleRangeChange(event) {
        let val = event.target.value;
        if (val > this.props.max) {
            val = this.props.max;
        } else if (val < this.props.min) {
            val = this.props.min;
        }
        this.props.setAudio(val);
        this.setState({
            val: val,
            num: val,
        });
    }

    handleNumChange(event) {
        if (isNaN(event.target.value) && event.target.value !== '-') {
            return;
        }
        this.setState({
            num: event.target.value,
        });
    }

    handleNumSubmit() {
        let temp = this.state.num;
        if (temp > this.props.max) {
            temp = this.props.max;
        } else if (temp < this.props.min) {
            temp = this.props.min;
        }
        this.setState({
            val: temp,
            num: temp,
        });
    }

    render() {
        return (
            <div id={this.props.labelName + 'Div'} className="tooltip">
                <input
                    id={this.props.labelName + 'Range'}
                    type="range"
                    value={this.state.val}
                    min={this.props.min}
                    max={this.props.max}
                    step={this.props.step}
                    onChange={this.handleRangeChange}
                ></input>
                <input
                    id={this.props.labelName + 'Number'}
                    value={this.state.num}
                    type="text"
                    onChange={this.handleNumChange}
                    onKeyPress={(event) => {
                        if (event.key === 'Enter') {
                            this.handleNumSubmit();
                        }
                    }}
                ></input>
                <span id={this.props.labelName + 'Span'} className="tooltiptext">
                    {this.props.tooltipText}
                </span>
            </div>
        );
    }
}

export default Slider;
