import React from 'react';

class MyButton extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            count: 0,
        };

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        if (this.props.audioIn) {
            return;
        }
        this.props.handleClick(this.props.name + ' ' + this.state.count, this.props.name, this.props.inputOnly);
        this.setState((state) => ({
            count: state.count + 1,
        }));
    }

    render() {
        return (
            <button className="addBtn" onClick={this.handleClick}>
                {this.props.name}
            </button>
        );
    }
}

export default MyButton;
