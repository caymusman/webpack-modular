import React from 'react';

class LogSlider extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            val: Number(Math.log(this.props.mid) / Math.log(this.props.max)),
            num: this.props.mid,
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleNumChange = this.handleNumChange.bind(this);
        this.handleNumFreqChange = this.handleNumFreqChange.bind(this);
    }

    handleChange(event) {
        this.setState({
            val: event.target.value,
            num: Number((Math.pow(this.props.max, event.target.value) - 1).toFixed(2)),
        });
        this.props.onChange(Number((Math.pow(this.props.max, event.target.value) - 1).toFixed(2)));
    }

    handleNumChange(event) {
        if (isNaN(event.target.value) && event.target.value !== '0.') {
            return;
        }
        this.setState({
            num: event.target.value,
        });
    }

    handleNumFreqChange() {
        let temp = this.state.num;
        if (temp > this.props.max - 1) {
            temp = this.props.max - 1;
        } else if (temp < this.props.min) {
            temp = this.props.min;
        }
        this.setState({
            val: Math.log(Number(temp) + 1) / Math.log(this.props.max - 1),
            num: Number(Number(temp).toFixed(2)),
        });
        this.props.onChange(Number(Number(temp).toFixed(2)));
    }

    componentDidUpdate(prevProps) {
        if (prevProps.mid !== this.props.mid) {
            this.setState({
                val: Number(Math.log(this.props.mid) / Math.log(this.props.max)),
                num: this.props.mid,
            });
        }
    }

    render() {
        return (
            <div id={this.props.labelName + 'logSliderWhole'} className="tooltip">
                <input
                    className={this.props.labelName + 'freqNumRange'}
                    value={this.state.val}
                    type="range"
                    min={Number(Math.log(this.props.min + 1) / Math.log(this.props.max))}
                    max={1}
                    step="any"
                    onChange={this.handleChange}
                ></input>
                <input
                    id={this.props.labelName + 'freqNumInput'}
                    value={this.state.num}
                    type="text"
                    onChange={this.handleNumChange}
                    onKeyPress={(event) => {
                        if (event.key === 'Enter') {
                            this.handleNumFreqChange();
                        }
                    }}
                ></input>
                <span id={this.props.labelName + 'logSliderFreqTip'} className="tooltiptext">
                    {this.props.tooltipText}
                </span>
            </div>
        );
    }
}

export default LogSlider;
