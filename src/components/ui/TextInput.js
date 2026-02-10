import React from 'react';

class TextInput extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            val: this.props.defaultVal,
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleNumSubmit = this.handleNumSubmit.bind(this);
    }

    handleChange(event) {
        if (isNaN(event.target.value) && event.target.value !== '0.') {
            return;
        }
        this.setState({
            val: event.target.value,
        });
    }

    handleNumSubmit() {
        let temp = this.state.val;
        if (temp > this.props.max) {
            temp = this.props.max;
            this.setState({ val: this.props.max });
        } else if (temp < this.props.min) {
            temp = this.props.min;
            this.setState({ val: this.props.min });
        }
        this.props.onSubmit(this.props.tooltipText, Number(temp));
    }

    render() {
        return (
            <label id={this.props.labelName + 'inputLabel'} className="tooltip">
                <input
                    value={this.state.val}
                    type="text"
                    onChange={this.handleChange}
                    onKeyPress={(event) => {
                        if (event.key === 'Enter') {
                            this.handleNumSubmit();
                        }
                    }}
                ></input>
                <span id={this.props.labelName + 'Tip'} className="tooltiptext">
                    {this.props.tooltipText}
                </span>
            </label>
        );
    }
}

export default TextInput;
