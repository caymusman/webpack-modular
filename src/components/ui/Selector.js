import React from 'react';

class Selector extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            val: this.props.values[0],
        };

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(event) {
        this.setState({
            val: event.target.innerHTML,
        });
        this.props.handleClick(event.target.innerHTML);
    }

    render() {
        return (
            <div id={this.props.id} className="selectorDiv">
                <span>{this.state.val}</span>
                <div id="selectorContent">
                    {this.props.values.map((el) => {
                        return (
                            <div key={el} className="selectorVal" onClick={this.handleClick}>
                                {el}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
}

export default Selector;
