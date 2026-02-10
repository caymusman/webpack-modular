import React from 'react';

class Cord extends React.Component {
    constructor(props) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        this.props.deleteCord(this.props.id);
    }

    render() {
        return (
            <line
                x1={this.props.x1}
                y1={this.props.y1}
                x2={this.props.x2}
                y2={this.props.y2}
                onClick={this.handleClick}
            ></line>
        );
    }
}

export default Cord;
