import Draggable from 'react-draggable';
import React from 'react';
import Area from './components/Area';
import Cord from './components/Cord';
import Output from './components/Output';
import SideButtons from './components/SideButtons';

export default class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            list: new Map(),
            patchCords: [],
            currentCordCount: 0,
            cumulativeCordCount: 0,
            outputMode: false,
            cordCombos: {},
            alert: false,
            pingText: '',
            audioContext: new AudioContext(),
            audioIn: false,
        };
        this.handleClick = this.handleClick.bind(this);
        this.handleClose = this.handleClose.bind(this);

        this.addCord = this.addCord.bind(this);
        this.handlePatchExit = this.handlePatchExit.bind(this);
        this.handleOutput = this.handleOutput.bind(this);
        this.deleteCord = this.deleteCord.bind(this);
        this.handleDrag = this.handleDrag.bind(this);
        this.handleComboDelete = this.handleComboDelete.bind(this);
        this.handlePingExit = this.handlePingExit.bind(this);
        this.myAlert = this.myAlert.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }

    //Passed to SideButtons to control which buttons are added to PlaySpace
    handleClick(childKey, childJSX, inputOnly) {
        if (this.state.outputMode) {
            this.handlePatchExit();
        }
        if (childKey.split(' ')[0] === 'AudioInput') {
            this.setState({ audioIn: true });
        }
        const newCombos = { ...this.state.cordCombos, [childKey]: [] };
        this.setState((state) => ({
            list: new Map([
                ...state.list,
                [childKey, { myKey: childKey, filling: childJSX, name: childKey.split(' ')[0], inputOnly: inputOnly }],
            ]),
            cordCombos: newCombos,
        }));
    }

    //Passed to Area to control which modules are removed from PlaySpace
    handleClose(childKey) {
        const newMap = new Map(this.state.list);
        newMap.delete(childKey);

        if (childKey.split(' ')[0] === 'AudioInput') {
            this.setState({ audioIn: false });
        }

        //need to delete all patchcords attached to it, and disconnect all audio streams.
        const newCords = [...this.state.patchCords];
        const finCords = [...this.state.patchCords];
        let minCount = 0;
        const newCombos = { ...this.state.cordCombos };
        newCords.forEach((el) => {
            if (el.fromData.fromModID === childKey) {
                const val = finCords.indexOf(el);
                finCords.splice(val, 1);
                minCount++;

                el.fromData.audio.disconnect(el.toData.audio);
            }
            if (
                el.toData.tomyKey === childKey ||
                el.toData.tomyKey.split(' ')[0] + ' ' + el.toData.tomyKey.split(' ')[1] === childKey
            ) {
                const val = finCords.indexOf(el);
                finCords.splice(val, 1);
                minCount++;

                el.fromData.audio.disconnect(el.toData.audio);

                //make sure any output cords are removed from cordCombos
                newCombos[el.fromData.fromModID].splice(newCombos[el.fromData.fromModID].indexOf(childKey), 1);
            }
        });

        //delete property from cordCombos object
        delete newCombos[childKey];

        this.setState((state) => ({
            list: newMap,
            patchCords: finCords,
            currentCordCount: state.currentCordCount - minCount,
            cordCombos: newCombos,
        }));
    }

    //click X to not make patch cord after input click
    handlePatchExit() {
        const newCords = [...this.state.patchCords];
        newCords.pop();
        this.setState((state) => ({
            currentCordCount: state.currentCordCount - 1,
            cumulativeCordCount: state.cumulativeCordCount - 1,
            outputMode: false,
            patchCords: newCords,
        }));
    }

    //add initial patch cord data upon input click
    addCord(info) {
        this.setState((state) => ({
            patchCords: [
                ...state.patchCords,
                { id: 'cord' + this.state.cumulativeCordCount, fromData: info, toData: null },
            ],
            currentCordCount: state.currentCordCount + 1,
            cumulativeCordCount: state.cumulativeCordCount + 1,
            outputMode: true,
        }));
    }

    //add output data to fully formed patch cords
    handleOutput(info) {
        if (this.state.outputMode) {
            const newCords = [...this.state.patchCords];
            const toData = 'toData';
            const lastEl = newCords[this.state.currentCordCount - 1];
            const fromMod = lastEl.fromData.fromModID;
            if (fromMod === info.tomyKey) {
                this.myAlert('You cannot plug a module into itself!');
                this.handlePatchExit();
            } else if (this.state.cordCombos[fromMod].includes(info.tomyKey)) {
                this.myAlert("You've already patched this cable!");
                this.handlePatchExit();
            } else if (info.tomyKey.includes(fromMod)) {
                this.myAlert('Hahaha thats a new one. Nice try.');
                this.handlePatchExit();
            } else {
                lastEl[toData] = info;
                const newCombo = { ...this.state.cordCombos };
                newCombo[fromMod].push(info.tomyKey);
                this.setState((_state) => ({
                    patchCords: newCords,
                    cordCombos: newCombo,
                }));

                this.setState({
                    outputMode: false,
                });

                //handle Audio
                lastEl.fromData.audio.connect(info.audio);
            }
        }
    }

    deleteCord(cordID) {
        const newArr = [...this.state.patchCords];
        for (let i = 0; i < newArr.length; i++) {
            if (newArr[i].id === cordID) {
                newArr[i].fromData.audio.disconnect(newArr[i].toData.audio);
                break;
            }
        }
        this.setState((state) => ({
            patchCords: newArr.filter((el) => {
                return el.id !== cordID;
            }),
            currentCordCount: state.currentCordCount - 1,
        }));
        this.handleComboDelete(cordID);
    }

    handleComboDelete(cordID) {
        const cordVal = this.state.patchCords.find((val) => val.id === cordID);
        const fromCombo = cordVal.fromData.fromModID;
        const newCombo = { ...this.state.cordCombos };
        newCombo[fromCombo].splice(newCombo[fromCombo].indexOf(cordVal.toData.tomyKey), 1);
        this.setState({
            cordCombos: newCombo,
        });
    }

    //redraw cords when module is dragged
    handleDrag(modID) {
        const largerDim = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth;
        const newCords = [...this.state.patchCords];
        newCords.forEach((el) => {
            if (el.fromData.fromModID === modID) {
                const in_el = document.getElementById(modID + 'outputInner').getBoundingClientRect();
                const in_x = in_el.x;
                const in_y = in_el.y;
                const in_bottom = in_el.bottom;
                const in_right = in_el.right;
                const in_xCenter = (in_right - in_x) / 2 + in_x - largerDim * 0.04;
                const in_yCenter = (in_bottom - in_y) / 2 + in_y - largerDim * 0.04;
                el.fromData.fromLocation = { x: in_xCenter, y: in_yCenter };
            } else if (el.toData.tomyKey === modID) {
                const to_el = document.getElementById(modID + 'inputInner').getBoundingClientRect();
                const to_x = to_el.x;
                const to_y = to_el.y;
                const to_bottom = to_el.bottom;
                const to_right = to_el.right;
                const to_xCenter = (to_right - to_x) / 2 + to_x - largerDim * 0.04;
                const to_yCenter = (to_bottom - to_y) / 2 + to_y - largerDim * 0.04;
                el.toData.toLocation = { x: to_xCenter, y: to_yCenter };
            } else if (
                el.toData.tomyKey.includes(' ') &&
                el.toData.tomyKey.split(' ')[0] + ' ' + el.toData.tomyKey.split(' ')[1] === modID
            ) {
                const to_el = document.getElementById(el.toData.tomyKey + ' inputInner').getBoundingClientRect();
                const to_x = to_el.x;
                const to_y = to_el.y;
                const to_bottom = to_el.bottom;
                const to_right = to_el.right;
                const to_xCenter = (to_right - to_x) / 2 + to_x - largerDim * 0.04;
                const to_yCenter = (to_bottom - to_y) / 2 + to_y - largerDim * 0.04;
                el.toData.toLocation = { x: to_xCenter, y: to_yCenter };
            }
        });

        this.setState({
            patchCords: newCords,
        });
    }

    handleResize() {
        const largerDim = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth;
        const newCords = [...this.state.patchCords];
        newCords.forEach((el) => {
            const fromID = el.fromData.fromModID;
            const in_el = document.getElementById(fromID + 'outputInner').getBoundingClientRect();
            const in_xCenter = (in_el.right - in_el.x) / 2 + in_el.x - largerDim * 0.04;
            const in_yCenter = (in_el.bottom - in_el.y) / 2 + in_el.y - largerDim * 0.04;
            el.fromData.fromLocation = { x: in_xCenter, y: in_yCenter };

            const toID = el.toData.tomyKey;
            const out_el = document.getElementById(toID + 'inputInner').getBoundingClientRect();
            const out_xCenter = (out_el.right - out_el.x) / 2 + out_el.x - largerDim * 0.04;
            const out_yCenter = (out_el.bottom - out_el.y) / 2 + out_el.y - largerDim * 0.04;
            el.toData.toLocation = { x: out_xCenter, y: out_yCenter };
        });

        this.setState({
            patchCords: newCords,
        });
    }

    myAlert(ping) {
        this.setState({
            alert: true,
            pingText: ping,
        });
    }

    handlePingExit() {
        this.setState({
            alert: false,
            pingText: '',
        });
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleResize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    }

    render() {
        const dragHandlers = { onStart: this.onStart, onStop: this.onStop };
        const cords = []; //loop through the cords in the state, add line version to this array
        const tempArr = [...this.state.patchCords];
        tempArr.forEach((el) => {
            if (el['toData']) {
                cords.push(
                    <Cord
                        deleteCord={this.deleteCord}
                        key={el.id}
                        id={el.id}
                        x1={el.fromData.fromLocation.x}
                        y1={el.fromData.fromLocation.y}
                        x2={el.toData.toLocation.x}
                        y2={el.toData.toLocation.y}
                    ></Cord>
                );
            }
        });
        return (
            <div id="mainDiv">
                <div id="logo"></div>
                <div id="header"></div>
                <div id="sidebar">
                    <SideButtons id="sideButtons" handleClick={this.handleClick} audioIn={this.state.audioIn} />
                </div>
                <div id="playSpace">
                    <svg id="patchCords">{cords}</svg>
                    <div className={this.state.alert ? 'show pingBox' : 'hide pingBox'}>
                        <div id="pingTextDiv">
                            <h3 className="error">Not so fast!</h3>
                        </div>
                        <p id="pingText">{this.state.pingText}</p>
                        <i
                            id="pingExit"
                            onClick={this.handlePingExit}
                            className="fa fa-times-circle"
                            aria-hidden="true"
                        ></i>
                    </div>
                    <i
                        id="patchExit"
                        onClick={this.handlePatchExit}
                        className={this.state.outputMode ? 'show fa fa-times-circle' : 'hide fa fa-times-circle'}
                        aria-hidden="true"
                    ></i>

                    {[...this.state.list].map(([key, { myKey, filling, name, inputOnly }]) => {
                        return (
                            <Draggable
                                onDrag={() => {
                                    this.handleDrag(key);
                                }}
                                key={key}
                                handle="p"
                                {...dragHandlers}
                                bounds="parent"
                            >
                                <div className="dragDiv">
                                    <Area
                                        key={myKey}
                                        myKey={myKey}
                                        filling={filling}
                                        name={name}
                                        handleClose={this.handleClose}
                                        outputMode={this.state.outputMode}
                                        addPatch={this.addCord}
                                        handleOutput={this.handleOutput}
                                        inputOnly={inputOnly}
                                        audioContext={this.state.audioContext}
                                        alert={this.myAlert}
                                    />
                                </div>
                            </Draggable>
                        );
                    })}
                    <Output handleOutput={this.handleOutput} audioContext={this.state.audioContext} />
                </div>
            </div>
        );
    }
}
