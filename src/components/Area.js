import React from 'react';
import Oscillator from './modules/Oscillator';
import Gain from './modules/Gain';
import Filter from './modules/Filter';
import Panner from './modules/Panner';
import ADSR from './modules/ADSR';
import Delay from './modules/Delay';
import Distortion from './modules/Distortion';
import Reverb from './modules/Reverb';
import AudioInput from './modules/AudioInput';
import Recorder from './modules/Recorder';

class Area extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            audio: {},
        };

        this.handleClose = this.handleClose.bind(this);
        this.handleCreatePatch = this.handleCreatePatch.bind(this);
        this.handleOutput = this.handleOutput.bind(this);
        this.createAudio = this.createAudio.bind(this);
        this.renderFilling = this.renderFilling.bind(this);
    }

    //Close on press of X icon. Pass key up to App and remove from state.list
    handleClose() {
        this.props.handleClose(this.props.myKey);
    }

    //handle first click in input area
    handleCreatePatch(event) {
        if (!this.props.outputMode) {
            const largerDim = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth;
            const el = event.target.getBoundingClientRect();
            const x = el.x;
            const y = el.y;
            const bottom = el.bottom;
            const right = el.right;
            const xCenter = (right - x) / 2 + x - largerDim * 0.04;
            const yCenter = (bottom - y) / 2 + y - largerDim * 0.04;
            this.props.addPatch({
                fromModID: this.props.myKey,
                fromLocation: { x: xCenter, y: yCenter },
                audio: this.state.audio,
            });
        }
    }

    //handle patchcord click in output area
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
            tomyKey: this.props.myKey,
            toLocation: { x: xCenter, y: yCenter },
            audio: this.state.audio,
        });
    }

    createAudio(childAudio) {
        this.setState({
            audio: childAudio,
        });
    }

    renderFilling() {
        switch (this.props.filling) {
            case 'Oscillator':
                return (
                    <Oscillator
                        audioContext={this.props.audioContext}
                        createAudio={this.createAudio}
                        parent={this.props.myKey}
                        handleOutput={this.props.handleOutput}
                    />
                );
            case 'Gain':
                return (
                    <Gain
                        audioContext={this.props.audioContext}
                        createAudio={this.createAudio}
                        parent={this.props.myKey}
                        handleOutput={this.props.handleOutput}
                    />
                );
            case 'Filter':
                return <Filter audioContext={this.props.audioContext} createAudio={this.createAudio} />;
            case 'Panner':
                return <Panner audioContext={this.props.audioContext} createAudio={this.createAudio} />;
            case 'ADSR':
                return <ADSR audioContext={this.props.audioContext} createAudio={this.createAudio} />;
            case 'Delay':
                return <Delay audioContext={this.props.audioContext} createAudio={this.createAudio} />;
            case 'Distortion':
                return <Distortion audioContext={this.props.audioContext} createAudio={this.createAudio} />;
            case 'Reverb':
                return <Reverb audioContext={this.props.audioContext} createAudio={this.createAudio} />;
            case 'AudioInput':
                return (
                    <AudioInput
                        alert={this.props.alert}
                        handleClose={this.handleClose}
                        audioContext={this.props.audioContext}
                        createAudio={this.createAudio}
                    />
                );
            case 'Recorder':
                return <Recorder audioContext={this.props.audioContext} createAudio={this.createAudio} />;
            default:
                return <div>Hahahahaha theres nothing here!</div>;
        }
    }

    render() {
        return (
            <div className="moduleDiv">
                <p id="modTitle">
                    <i className="fa fa-times" aria-hidden="true" onClick={this.handleClose}></i>
                    {this.props.name}
                </p>

                {/*eventually will be unique module fillings*/}
                <div id="innerModDiv">{this.renderFilling()}</div>

                {/*input patch cords area*/}
                <div
                    className={this.props.outputMode ? 'cordOuter hide' : 'cordOuter show interactive'}
                    id="outputOuter"
                    onClick={this.handleCreatePatch}
                >
                    <div className="cordInner" id={this.props.myKey + 'outputInner'}></div>
                </div>
                {/*output patch cords area*/}

                {this.props.inputOnly === 'false' && (
                    <div
                        className={this.props.outputMode ? 'cordOuter show raise interactive' : 'cordOuter show'}
                        id="inputOuter"
                        onClick={this.handleOutput}
                    >
                        <div className="cordInner" id={this.props.myKey + 'inputInner'}></div>
                    </div>
                )}
            </div>
        );
    }
}

export default Area;
