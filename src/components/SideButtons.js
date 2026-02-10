import React from 'react';
import MyButton from './ui/MyButton';

class SideButtons extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id={this.props.id}>
                <MyButton name="Oscillator" handleClick={this.props.handleClick} inputOnly="true" />
                <MyButton name="Gain" handleClick={this.props.handleClick} inputOnly="false" />
                <MyButton name="Filter" handleClick={this.props.handleClick} inputOnly="false" />
                <MyButton name="Panner" handleClick={this.props.handleClick} inputOnly="false" />
                <MyButton name="ADSR" handleClick={this.props.handleClick} inputOnly="false" />
                <MyButton name="Delay" handleClick={this.props.handleClick} inputOnly="false" />
                <MyButton name="Distortion" handleClick={this.props.handleClick} inputOnly="false" />
                <MyButton name="Reverb" handleClick={this.props.handleClick} inputOnly="false" />
                <MyButton
                    name="AudioInput"
                    handleClick={this.props.handleClick}
                    inputOnly="true"
                    audioIn={this.props.audioIn}
                />
                <MyButton name="Recorder" handleClick={this.props.handleClick} inputOnly="false" />
            </div>
        );
    }
}

export default SideButtons;
