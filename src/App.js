import Draggable from 'react-draggable';
import React from 'react';


export default class App extends React.Component{
    constructor(props){
        super(props);

        this.state = {
            list: new Map(),
            patchCords: [],
            currentCordCount: 0,
            cumulativeCordCount: 0,
            outputMode: false,
            cordCombos: {},
            alert: false,
            pingText: "",
            audioContext: new AudioContext(),
            audioIn: false
        }
        this.handleClick=this.handleClick.bind(this);
        this.handleClose=this.handleClose.bind(this);

        this.addCord=this.addCord.bind(this);
        this.handlePatchExit=this.handlePatchExit.bind(this);
        this.handleOutput=this.handleOutput.bind(this);
        this.deleteCord=this.deleteCord.bind(this);
        this.handleDrag=this.handleDrag.bind(this);
        this.handleComboDelete=this.handleComboDelete.bind(this);
        this.handlePingExit=this.handlePingExit.bind(this);
        this.myAlert=this.myAlert.bind(this);
        this.handleResize=this.handleResize.bind(this);
    }

    //Passed to SideButtons to control which buttons are added to PlaySpace
    handleClick(childKey, childJSX, inputOnly){
        if(this.state.outputMode){
            this.handlePatchExit();
        }
        if(childKey.split(" ")[0] == "AudioInput"){
            this.setState({audioIn: true});
        }
        let newCombos = {...this.state.cordCombos, [childKey]: []};
        this.setState((state) => ({
            list: new Map([...state.list, [childKey, {myKey: childKey,
                                                    filling: childJSX,
                                                    name:childKey.split(" ")[0],
                                                    inputOnly: inputOnly}]]),
            cordCombos: newCombos
        }));
    };

    //Passed to Area to control which modules are removed from PlaySpace
    handleClose(childKey){
        let newMap = new Map(this.state.list);
        newMap.delete(childKey);

        if(childKey.split(" ")[0] == "AudioInput"){
            this.setState({audioIn: false});
        }

        //need to delete all patchcords attached to it, and disconnect all audio streams.
        let newCords = [...this.state.patchCords];
        let finCords = [...this.state.patchCords];
        let minCount = 0;
        let newCombos = {...this.state.cordCombos};
        newCords.forEach(el => {
            if(el.fromData.fromModID == childKey){
                let val = finCords.indexOf(el);
                finCords.splice(val, 1);
                minCount++;

                el.fromData.audio.disconnect(el.toData.audio);
                }
            if(el.toData.tomyKey == childKey || el.toData.tomyKey.split(' ')[0] + " " + el.toData.tomyKey.split(' ')[1] == childKey){
                let val = finCords.indexOf(el);
                finCords.splice(val, 1);
                minCount++;

                el.fromData.audio.disconnect(el.toData.audio);
                
                //make sure any output cords are removed from cordCombos
                newCombos[el.fromData.fromModID].splice(newCombos[el.fromData.fromModID].indexOf(childKey), 1);
            }
            })

        //delete property from cordCombos object    
        delete newCombos[childKey];


        this.setState(state => ({
            list: newMap,
            patchCords: finCords,
            currentCordCount: state.currentCordCount - minCount,
            cordCombos: newCombos
        }))
    }

    //click X to not make patch cord after input click
    handlePatchExit(){
        let newCords = [...this.state.patchCords];
        let popped = newCords.pop();
        this.setState(state => ({
            currentCordCount: state.currentCordCount - 1,
            cumulativeCordCount: state.cumulativeCordCount - 1,
            outputMode: false,
            patchCords: newCords
        }))
    }

    //add initial patch cord data upon input click
    addCord(info){
        this.setState((state) => ({
            patchCords: [...state.patchCords, {id: "cord" + this.state.cumulativeCordCount, fromData: info, toData: null}],
            currentCordCount: state.currentCordCount + 1,
            cumulativeCordCount: state.cumulativeCordCount + 1,
            outputMode: true
        }))
    }

    //add output data to fully formed patch cords
    handleOutput(info){
        if(this.state.outputMode){
            let newCords = [...this.state.patchCords];
            let toData = "toData";
            let lastEl = newCords[this.state.currentCordCount-1];
            let fromMod = lastEl.fromData.fromModID;
            if(fromMod == info.tomyKey){
                this.myAlert("You cannot plug a module into itself!");
                this.handlePatchExit();
            }else if(this.state.cordCombos[fromMod].includes(info.tomyKey)){
                this.myAlert("You've already patched this cable!");
                this.handlePatchExit();
            }else if(info.tomyKey.includes(fromMod)){
                this.myAlert("Hahaha thats a new one. Nice try.");
                this.handlePatchExit();
            }else{
                lastEl[toData]=info;
                let newCombo = {...this.state.cordCombos};
                newCombo[fromMod].push(info.tomyKey);
                this.setState((state) => ({
                    patchCords: newCords,
                    cordCombos: newCombo
             }));

             this.setState({
                    outputMode: false
             })
            }
            //handle Audio
            lastEl.fromData.audio.connect(info.audio);
        }
    }

    
    deleteCord(cordID){
        let newArr = [...this.state.patchCords];
        for(let i = 0; i < newArr.length; i++){
            if(newArr[i].id == cordID){
                newArr[i].fromData.audio.disconnect(newArr[i].toData.audio);
                break;
            }
        }
        this.setState(state => ({
            patchCords: newArr.filter(el => {
                return el.id !== cordID;
            }),
            currentCordCount: state.currentCordCount - 1,
        }))
        this.handleComboDelete(cordID);
    }

    handleComboDelete(cordID){
        const cordVal = this.state.patchCords.find(val => val.id == cordID);
        let fromCombo = cordVal.fromData.fromModID;
        let newCombo = {...this.state.cordCombos};
        newCombo[fromCombo].splice(newCombo[fromCombo].indexOf(cordVal.toData.tomyKey), 1);
        this.setState({
            cordCombos: newCombo
        })
    }

    //redraw cords when module is dragged
    handleDrag(modID){
        let largerDim = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth;
        let newCords = [...this.state.patchCords];
        newCords.forEach(el => {
            if(el.fromData.fromModID == modID){ 
                let in_el = document.getElementById(modID + "outputInner").getBoundingClientRect();
                let in_x = in_el.x;
                let in_y = in_el.y;
                let in_bottom = in_el.bottom;
                let in_right = in_el.right;
                let in_xCenter = ((in_right - in_x) / 2 + in_x) - (largerDim * .04);
                let in_yCenter = ((in_bottom - in_y) / 2 + in_y) - (largerDim * .04);
                el.fromData.fromLocation = {x: in_xCenter, y: in_yCenter}
            }else if(el.toData.tomyKey == modID){
                let to_el = document.getElementById(modID + "inputInner").getBoundingClientRect();
                let to_x = to_el.x;
                let to_y = to_el.y;
                let to_bottom = to_el.bottom;
                let to_right = to_el.right;
                let to_xCenter = ((to_right - to_x) / 2 + to_x) - (largerDim * .04);
                let to_yCenter = ((to_bottom - to_y) / 2 + to_y) - (largerDim * .04);
                el.toData.toLocation = {x: to_xCenter, y: to_yCenter}
            }else if(el.toData.tomyKey.includes(" ") && el.toData.tomyKey.split(' ')[0] + " " + el.toData.tomyKey.split(' ')[1] == modID){
                let newStr = el.toData.tomyKey.split(' ')[2];
                let to_el = document.getElementById(el.toData.tomyKey + " inputInner").getBoundingClientRect();
                let to_x = to_el.x;
                let to_y = to_el.y;
                let to_bottom = to_el.bottom;
                let to_right = to_el.right;
                let to_xCenter = ((to_right - to_x) / 2 + to_x) - (largerDim * .04);
                let to_yCenter = ((to_bottom - to_y) / 2 + to_y) - (largerDim * .04);
                el.toData.toLocation = {x: to_xCenter, y: to_yCenter}
            }
        })

        this.setState(state => ({
            patchCords: newCords
        }))
    }

    handleResize(){
        let largerDim = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth;
        let newCords = [...this.state.patchCords];
        newCords.forEach(el => {
            let fromID = el.fromData.fromModID;
            let in_el = document.getElementById(fromID + "outputInner").getBoundingClientRect();
            let in_xCenter = ((in_el.right - in_el.x) / 2 + in_el.x) - (largerDim * .04);
            let in_yCenter = ((in_el.bottom - in_el.y) / 2 + in_el.y) - (largerDim * .04);
            el.fromData.fromLocation = {x: in_xCenter, y: in_yCenter}

            let toID = el.toData.tomyKey;
            let out_el = document.getElementById(toID + "inputInner").getBoundingClientRect();
            let out_xCenter = ((out_el.right - out_el.x) / 2 + out_el.x) - (largerDim * .04);
            let out_yCenter = ((out_el.bottom - out_el.y) / 2 + out_el.y) - (largerDim * .04);
            el.toData.toLocation = {x: out_xCenter, y: out_yCenter}
        })

        this.setState({
            patchCords: newCords
        })
    }

    myAlert(ping){
        this.setState({
            alert: true,
            pingText: ping
        })
    }

    handlePingExit(){
        this.setState({
            alert: false,
            pingText: ""
        })
    }

    componentDidMount(){
        window.addEventListener('resize', this.handleResize);
    }


    render(){
        const dragHandlers = {onStart: this.onStart, onStop: this.onStop};
        let cords = []; //loop through the cords in the state, add line version to this array
        let tempArr = [...this.state.patchCords];
        tempArr.forEach(el => {
            if(el['toData']){
                cords.push(<Cord deleteCord={this.deleteCord} key={el.id} id={el.id} x1={el.fromData.fromLocation.x} y1={el.fromData.fromLocation.y} x2={el.toData.toLocation.x} y2={el.toData.toLocation.y}></Cord>)
            }
        })
        return(
            <div id="mainDiv">
                <div id="logo"></div>
                <div id="header"></div>
                <div id="sidebar">
                    <SideButtons 
                                id="sideButtons" 
                                handleClick={this.handleClick}
                                audioIn={this.state.audioIn}
                                /> 
                </div>
                <div id="playSpace">
                    <svg id="patchCords">{cords}</svg>
                    <div className={this.state.alert ? "show pingBox" : "hide pingBox"}>
                        <div id="pingTextDiv">
                            <h3 className="error">Not so fast!</h3>
                        </div>
                        <p id="pingText">{this.state.pingText}</p>
                        <i 
                        id="pingExit" 
                        onClick={this.handlePingExit}
                        className="fa fa-times-circle"
                        aria-hidden="true"></i>
                    </div>
                    <i 
                        id="patchExit" 
                        onClick={this.handlePatchExit}
                        className={this.state.outputMode ? "show fa fa-times-circle" : "hide fa fa-times-circle"} 
                        aria-hidden="true"></i>

                {[...this.state.list].map(([key, {myKey, filling, name, inputOnly}]) => {
                        return <Draggable onDrag={() => {this.handleDrag(key)}} key={key} handle="p" {...dragHandlers} bounds="parent">
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
                                    </div></Draggable>
                    })}
                    <Output handleOutput={this.handleOutput}
                            audioContext={this.state.audioContext}
                    />
                </div>
            </div>
        )
    }
}


//Create a draggable module with filling that changes based on which button you press to create module.
class Area extends React.Component{
    constructor(props){
        super(props);

        this.state={
            audio: {}
        }

        this.handleClose=this.handleClose.bind(this);
        this.handleCreatePatch=this.handleCreatePatch.bind(this);
        this.handleOutput=this.handleOutput.bind(this);
        this.createAudio=this.createAudio.bind(this);
        this.renderFilling=this.renderFilling.bind(this);
    }


    //Close on press of X icon. Pass key up to App and remove from state.list
    handleClose(){
        this.props.handleClose(this.props.myKey);
    }

    //handle first click in input area
    handleCreatePatch(event){
        if(!this.props.outputMode){
            let largerDim = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth;
            let el = event.target.getBoundingClientRect();
            let x = el.x;
            let y = el.y;
            let bottom = el.bottom;
            let right = el.right;
            let xCenter = ((right - x) / 2 + x) - (largerDim * .04);
            let yCenter = ((bottom - y) / 2 + y) - (largerDim * .04);
            this.props.addPatch({fromModID: this.props.myKey,
                             fromLocation: {x: xCenter, y: yCenter},
                            audio: this.state.audio});
            }
    }

    //handle patchcord click in output area
    handleOutput(event){
        let largerDim = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth;
        let el = event.target.getBoundingClientRect();
        let x = el.x;
        let y = el.y;
        let bottom = el.bottom;
        let right = el.right;
        let xCenter = ((right - x) / 2 + x) - (largerDim * .04);
        let yCenter = ((bottom - y) / 2 + y) - (largerDim * .04);
        
        this.props.handleOutput({tomyKey: this.props.myKey,
                                 toLocation: {x: xCenter, y: yCenter},
                                audio: this.state.audio});
        }

    createAudio(childAudio){
        this.setState({
            audio: childAudio
        })
    }

    renderFilling(){
        switch(this.props.filling){
            case "Oscillator":
                return <Oscillator audioContext={this.props.audioContext} createAudio={this.createAudio} parent={this.props.myKey} handleOutput={this.props.handleOutput}/>;
            case "Gain":
                return <Gain audioContext={this.props.audioContext} createAudio={this.createAudio} parent={this.props.myKey} handleOutput={this.props.handleOutput}/>
            case "Filter":
                return <Filter audioContext={this.props.audioContext} createAudio={this.createAudio}/>;
            case "Panner":
                return <Panner audioContext={this.props.audioContext} createAudio={this.createAudio}/>
            case "ADSR":
                return <ADSR audioContext={this.props.audioContext} createAudio={this.createAudio}/>
            case "Delay":
                return <Delay audioContext={this.props.audioContext} createAudio={this.createAudio}/>
            case "Distortion":
                return <Distortion audioContext={this.props.audioContext} createAudio={this.createAudio}/>
            case "Reverb":
                return <Reverb audioContext={this.props.audioContext} createAudio={this.createAudio}/>
            case "AudioInput":
                return <AudioInput alert={this.props.alert} handleClose={this.handleClose} audioContext={this.props.audioContext} createAudio={this.createAudio}/>
            case "Recorder":
                return <Recorder audioContext={this.props.audioContext} createAudio={this.createAudio}/>
            default:
                return <div>Hahahahaha theres nothing here!</div>;
        }
    }


    render(){
        return(
                <div className="moduleDiv"
                    >

                    <p id="modTitle">
                        <i className="fa fa-times" aria-hidden="true" onClick={this.handleClose}></i>{
                        this.props.name}
                    </p>

                    {/*eventually will be unique module fillings*/}
                    <div id="innerModDiv">
                         {this.renderFilling()}
                    </div>

                    {/*input patch cords area*/}
                    <div className={this.props.outputMode ? "cordOuter hide" : "cordOuter show interactive"} 
                         id="outputOuter" onClick={this.handleCreatePatch}>
                            <div className="cordInner" id={this.props.myKey + "outputInner"}>
                            </div>
                    </div>
                    {/*output patch cords area*/}
                    
                    {
                        this.props.inputOnly == "false" &&
                        <div className={this.props.outputMode ? "cordOuter show raise interactive" : "cordOuter show"} 
                             id="inputOuter" onClick={this.handleOutput}>
                                 <div className="cordInner" id={this.props.myKey + "inputInner"}>
                                 </div>
                         </div>
                    }
                </div>
        )
    }
}

//Oscillator Module
class Oscillator extends React.Component{
    constructor(props){
        super(props);

        this.state={
            audio: this.props.audioContext.createOscillator(),
            wave: "sine",
            min: 20,
            max: 20001,
            mid: 440,
            LFO: false,
            modulatorGain: this.props.audioContext.createGain()
        }

        this.setFreq=this.setFreq.bind(this);
        this.handleWaveChange=this.handleWaveChange.bind(this);
        this.handleLFOClick=this.handleLFOClick.bind(this);
        this.handleOutput=this.handleOutput.bind(this);
        this.setModDepth=this.setModDepth.bind(this);
    }

    setFreq(val){
        this.state.audio.frequency.setValueAtTime(Number(val), this.props.audioContext.currentTime);
    }

    handleWaveChange(wave){
        this.state.audio.type=wave;
        this.setState({
            wave: wave
        })
    }

    handleLFOClick(){
        if(this.state.LFO){
            this.setState({
                max: 20001,
                min: 20,
                mid: 440,
                LFO: false
            })
            this.state.audio.frequency.setValueAtTime(440, this.props.audioContext.currentTime);
        }else{
            this.setState({
                max: 21,
                min: 0,
                mid: 10,
                LFO: true
            })
            this.state.audio.frequency.setValueAtTime(10, this.props.audioContext.currentTime);
        }
    }

    handleOutput(event){
        let largerDim = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth;
        let el = event.target.getBoundingClientRect();
        let x = el.x;
        let y = el.y;
        let bottom = el.bottom;
        let right = el.right;
        let xCenter = ((right - x) / 2 + x) - (largerDim * .04);
        let yCenter = ((bottom - y) / 2 + y) - (largerDim * .04);
        
        this.props.handleOutput({tomyKey: this.props.parent+ " param",
                                 toLocation: {x: xCenter, y: yCenter},
                                audio: this.state.modulatorGain});
        }

    setModDepth(val){
        this.state.modulatorGain.gain.setValueAtTime(val, this.props.audioContext.currentTime);
    }

    componentDidMount(){
        this.props.createAudio(this.state.audio);
        this.state.audio.frequency.setValueAtTime(this.state.mid, this.props.audioContext.currentTime);
        this.state.modulatorGain.connect(this.state.audio.frequency);
        this.state.audio.start();
    }

    render(){
        return(
            <div className="oscDiv">
                <div id="oscBoxOne">
                    <Selector id="waveSelector" values={["sine", "sawtooth", "triangle"]} handleClick={this.handleWaveChange} />
                    <label id="oscSlider" className="switch tooltip">
                        <input type="checkbox" onClick={this.handleLFOClick}></input>
                        <span className="slider round"></span>
                        <span id="oscLFOTip" className="tooltiptext">LFO Mode</span>
                    </label>
                </div>
                <LogSlider labelName="oscFreq" tooltipText="Oscillator Frequency" min={this.state.min} max={this.state.max} mid={this.state.mid} onChange={this.setFreq}/>
                <div className="cordOuter tooltip" id="firstParam" onClick={this.handleOutput}>
                    <div className="cordInner" id={this.props.parent + " param" + " inputInner"}>
                    <div id="ttWrapper">
                        <span id="oscDetuneParamTip" className="tooltiptext"><span className="paramSpan">param: </span>frequency</span>
                    </div>
                    </div>
                </div>
                <Slider labelName="oscModGain" tooltipText="Mod Depth" min={0} max={300} mid={150} setAudio={this.setModDepth}/>
            </div>
        )
    }
}

class Gain extends React.Component{
    constructor(props){
        super(props);

        this.state={
            audio: this.props.audioContext.createGain(),
            value: .5,
            num: .5,
            max: 1,
            min: 0
        }

        this.handleGainChange=this.handleGainChange.bind(this);
        this.handleNumChange=this.handleNumChange.bind(this);
        this.handleNumGainChange=this.handleNumGainChange.bind(this);
        this.handleOutput=this.handleOutput.bind(this);
    }

    handleGainChange(event){
        let gainVal = event.target.value;
        if(gainVal > 1){
            gainVal=1;
        }else if(gainVal < 0){
            gainVal=0;
        }
        this.state.audio.gain.setValueAtTime(gainVal, this.props.audioContext.currentTime);
        this.setState({
            value: gainVal,
            num: gainVal
        });
    }

    handleNumChange(event){
        if(isNaN(event.target.value)){
            return;
        }
        this.setState({
            num: event.target.value
        })
    }

    handleNumGainChange(){
        let temp = this.state.num;
        if(temp > this.state.max){
            temp=this.state.max
        }else if(temp < this.state.min){
            temp=this.state.min
        }
        this.setState({
            value: temp,
            num: temp
        })
    }

    handleOutput(event){
        let largerDim = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth;
        let el = event.target.getBoundingClientRect();
        let x = el.x;
        let y = el.y;
        let bottom = el.bottom;
        let right = el.right;
        let xCenter = ((right - x) / 2 + x) - (largerDim * .04);
        let yCenter = ((bottom - y) / 2 + y) - (largerDim * .04);
        
        this.props.handleOutput({tomyKey: this.props.parent+ " param",
                                 toLocation: {x: xCenter, y: yCenter},
                                audio: this.state.audio.gain});
        }

    componentDidMount(){
        this.props.createAudio(this.state.audio);
        this.state.audio.gain.setValueAtTime(.5, this.props.audioContext.currentTime);
    }

    render(){
        return(
            <div className="gainDiv">
                <input id="gainRangeInput" type="range" value={this.state.value} min="0" max="1" step=".01" onChange={this.handleGainChange}></input>
                <input id="gainNumInput" value={this.state.num} type="text" onChange={this.handleNumChange} onKeyPress={event => {if(event.key == "Enter"){this.handleNumGainChange()}}}></input>

                <div className="cordOuter tooltip" id="firstParam" onClick={this.handleOutput}>
                    <div className="cordInner" id={this.props.parent + " param" + " inputInner"}>
                    <span id="gainGainParamTip" className="tooltiptext"><span className="paramSpan">param: </span>gain</span>
                    </div>
                </div>
            </div>
        )
    }
}

class Filter extends React.Component{
    constructor(props){
        super(props);

        this.state={
            audio: this.props.audioContext.createBiquadFilter(),
            type: "lowpass",
        }

        this.handleFilterType=this.handleFilterType.bind(this);
        this.setGain=this.setGain.bind(this);
        this.setFreq=this.setFreq.bind(this);
        this.handleDialChange=this.handleDialChange.bind(this);
    }

    handleFilterType(val){
        this.state.audio.type = val;
        this.setState({
            type: val
        })
    }

    setGain(val){
        this.state.audio.gain.setValueAtTime(val, this.props.audioContext.currentTime);
    }

    setFreq(val){
        this.state.audio.frequency.value=val;
    }

    handleDialChange(val){
        this.state.audio.Q.value=val;
    }

    componentDidMount(){
        this.props.createAudio(this.state.audio);
    }

    render(){
        let filterTypes=["lowpass", "highpass", "bandpass", "lowshelf", "highshelf", "peaking", "notch", "allpass"];
        return(
            <div className="filterDiv">
                <div id="filterBoxOne">
                    <Selector id="filterSelector" values={filterTypes} handleClick={this.handleFilterType}/>
                    <Dial min={0} max={1001} name="Q" onChange={this.handleDialChange}/>
                </div>
                <Slider labelName="filterGain" tooltipText="Filter Gain" min={-40} max={40} step={.01} setAudio={this.setGain}/>
                <LogSlider labelName="filterFreq" tooltipText="Filter Frequency" min={0} max={20001} mid={440} onChange={this.setFreq}/>
            </div>
        )
    }
}

class Panner extends React.Component{
    constructor(props){
        super(props);

        this.state={
            audio: this.props.audioContext.createStereoPanner(),
            val: 0
        }

        this.handlePan=this.handlePan.bind(this);
    }

    handlePan(val){
        this.state.audio.pan.value=val;
    }

    componentDidMount(){
        this.props.createAudio(this.state.audio);
    }

    render(){
        return(
            <div>
                <Slider labelName="panPan" tooltipText="Pan" min={-1} max={1} step={.001} setAudio={this.handlePan}></Slider>
            </div>
        )
    }
}

class Delay extends React.Component{
    constructor(props){
        super(props);

        this.state={
            audio: this.props.audioContext.createDelay(5.0),
        }

        this.handleDelayTime=this.handleDelayTime.bind(this);
    }

    handleDelayTime(val){
        this.state.audio.delayTime.setValueAtTime(val, this.props.audioContext.currentTime);
    }

    componentDidMount(){
        this.props.createAudio(this.state.audio);
    }

    render(){
        return(
            <div id="delayDiv">
                <Slider labelName="delayDelayTime" tooltipText="Delay Time (s)" min={0} max={5} step={.01} setAudio={this.handleDelayTime}></Slider>
            </div>
        )
    }
}


class Distortion extends React.Component{
    constructor(props){
        super(props);

        this.state={
            audio: this.props.audioContext.createWaveShaper(),
        }

        this.handleCurve=this.handleCurve.bind(this);
        this.makeCurve=this.makeCurve.bind(this);
        this.handleOversample=this.handleOversample.bind(this);
    }

    makeCurve(num){
        let temp = num;
        let n_samples = 44100;
        let curve = new Float32Array(n_samples);
        let deg = Math.PI / 180;
        let x;
        for (let i = 0 ; i < n_samples; ++i ) {
            x = i * 2 / n_samples - 1;
            curve[i] = ( 3 + temp ) * x * 20 * deg / ( Math.PI + temp * Math.abs(x) );
        }
        return curve;
    }

    handleCurve(val){
        this.state.audio.curve = this.makeCurve(val);
    }

    handleOversample(val){
        this.state.audio.oversample=val;
    }

    componentDidMount(){
        this.props.createAudio(this.state.audio);
    }

    render(){
        return(
            <div>
                <Slider labelName="distortionCurve" tooltipText="Distortion Curve" min={50} max={800} step={.1} setAudio={this.handleCurve}></Slider>
                <Selector id="distortionSelector" values={["none", "2x", "4x"]} handleClick={this.handleOversample}/>
            </div>
        )
    }
}

class Reverb extends React.Component{
    constructor(props){
        super(props);

        this.state={
            audio: this.props.audioContext.createConvolver(),
        }

        this.updateBuffer=this.updateBuffer.bind(this);
        this.handleSelector=this.handleSelector.bind(this);
    }

    updateBuffer(path){
        fetch(path)
            .then(res => res.arrayBuffer())
            .then(buffer => this.props.audioContext.decodeAudioData(buffer))
            .then(final => this.state.audio.buffer=final);
    }

    handleSelector(value){
        switch(value){
            case "Small":
                this.updateBuffer("media/short.wav");
                break;
            case "Medium":
                this.updateBuffer("media/medium.wav");
                break;
            case "Big":
                this.updateBuffer("media/long.wav");
                break;
        }
    }

    componentDidMount(){
        this.updateBuffer("media/short.wav");
        this.props.createAudio(this.state.audio);
    }

    render(){
        return(
            <div id="reverbDiv">
                <Selector id="reverbSelector" values={["Small", "Medium", "Large"]} handleClick={this.handleSelector}/>
                </div>
        )
    }
}

class ADSR extends React.Component{
    constructor(props){
        super(props);

        this.state = {
            audio: this.props.audioContext.createGain(),
            rate: 3000,
            interval: null,
            running: false,
            attack: .2,
            decay: .2,
            sustain: .6,
            release: .3,
        }
        this.handleSlider=this.handleSlider.bind(this);
        this.handleToggle=this.handleToggle.bind(this);
        this.handleAudio=this.handleAudio.bind(this);
        this.handleTextSubmit=this.handleTextSubmit.bind(this);
    }

    handleSlider(val){
        this.setState({
            rate: (1/val) * 1000
        })

        if(this.state.running){
            clearInterval(this.state.interval);
            this.setState({
                interval: setInterval(this.handleAudio, (1/val)*1000)
            })
        }
    }


    handleToggle(){
        let current = this.props.audioContext.currentTime;
        if(!this.state.running){
            this.setState({
                running: true,
                interval: setInterval(this.handleAudio, this.state.rate)
            });
        }else{
            this.state.audio.gain.setTargetAtTime(0, current + this.state.release, .5);
            clearInterval(this.state.interval);
            this.setState({
                running: false
            })
        }
    }

    handleAudio(){
        let current = this.props.audioContext.currentTime;
        this.state.audio.gain.cancelScheduledValues(current);
        this.state.audio.gain.setTargetAtTime(.90, current + this.state.attack, this.state.attack);
        this.state.audio.gain.setTargetAtTime(this.state.sustain, current + this.state.attack + this.state.decay, this.state.decay);
        this.state.audio.gain.setTargetAtTime(.001, current + this.state.attack + + this.state.decay + this.state.release, this.state.release);
    }

    handleTextSubmit(name, num){
        switch(name){
            case "Attack":
                this.setState({attack: num})
                break;
            case "Decay":
                this.setState({decay: num})
                break;
            case "Sustain":
                this.setState({sustain: num})
                break;
            case "Release":
                this.setState({release: num})
                break;
            default:
                return;
        }
    }

    componentDidMount(){
        this.props.createAudio(this.state.audio);
        this.state.audio.gain.setValueAtTime(0, this.props.audioContext.currentTime);
    }

    render(){
        return(
            <div id="ADSRDiv">
                <LogSlider labelName="ADSRSlider" tooltipText="LFO Rate" min={0} max={21} mid={10} onChange={this.handleSlider}></LogSlider>
                <div id="ADSRBox">
                    <label id="ADSRCheck" className="switch tooltip">
                            <input type="checkbox" onClick={this.handleToggle}></input>
                            <span className="slider round"></span>
                            <span id="ADSRCheckTip" className="tooltiptext">LFO Mode</span>
                    </label>
                    <button id="ADSRButton" onClick={this.handleAudio}>Pulse</button>
                </div>  
                <div id="ADSRControls">
                    <TextInput labelName="ADSRAttack" tooltipText="Attack" min={0} max={5} defaultVal={.2} onSubmit={this.handleTextSubmit}></TextInput>
                    <TextInput labelName="ADSRDecay" tooltipText="Decay" min={0} max={5} defaultVal={.2} onSubmit={this.handleTextSubmit}></TextInput>
                    <TextInput labelName="ADSRSustain" tooltipText="Sustain" min={0} max={1} defaultVal={.5} onSubmit={this.handleTextSubmit}></TextInput>
                    <TextInput labelName="ADSRRelease" tooltipText="Release" min={0} max={5} defaultVal={.3} onSubmit={this.handleTextSubmit}></TextInput>
                </div>
            </div>
        )
    }
}

class AudioInput extends React.Component{
    constructor(props){
        super(props);

        this.state = {
            outputGain: this.props.audioContext.createGain()
        }

        this.setGain=this.setGain.bind(this);
    }

    setGain(val){
        this.state.outputGain.gain.setValueAtTime(val, this.props.audioContext.currentTime);
    }

    componentDidMount(){
        if(navigator.mediaDevices){
            navigator.mediaDevices.getUserMedia({audio: true})
            .then(stream => {
                let audio = this.props.audioContext.createMediaStreamSource(stream);
                audio.connect(this.state.outputGain);
                this.state.outputGain.gain.setValueAtTime(.5, this.props.audioContext.currentTime);
                this.props.createAudio(this.state.outputGain);
            }).catch(err => {
                console.log("When setting up media devices, I caught: \n" + err); 
                this.props.handleClose();
                this.props.alert("You denied audio permissions. Allow permissions to create this module.")
            });
        }else{
            console.log("Media Devices are not supported!");
            this.props.handleClose();
            this.props.alert("Media Devices are not supported.")
        }
    }

    render(){
        return(
            <Slider labelName="audioInGain" tooltipText="Gain" min={0} max={1} step={.01} mid={.5} setAudio={this.setGain}/>
        )
    }
}

class Output extends React.Component{
    constructor(props){
        super(props);

        this.state={
            gainNode: this.props.audioContext.createGain(),
            value: .5
        }
        this.handleOutput=this.handleOutput.bind(this);
        this.handleChange=this.handleChange.bind(this);
    }

    handleOutput(event){
        let largerDim = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth;
        let el = event.target.getBoundingClientRect();
        let x = el.x;
        let y = el.y;
        let bottom = el.bottom;
        let right = el.right;
        let xCenter = ((right - x) / 2 + x) - (largerDim * .04);
        let yCenter = ((bottom - y) / 2 + y) - (largerDim * .04);
        
        this.props.handleOutput({tomyKey: "Output",
                                 toLocation: {x: xCenter, y: yCenter},
                                 audio: this.state.gainNode});
    }
    
    handleChange(event){
        this.state.gainNode.gain.setValueAtTime(event.target.value, this.props.audioContext.currentTime);
        this.setState({
            value: event.target.value
        })
    }
        

    render(){
        this.state.gainNode.connect(this.props.audioContext.destination);
        return(
            <div id="outputDiv">
                <p>Output</p>
                <div id="outputCenter">
                    <input id="gainSlider" value={this.state.value} type="range" min="0" max="1" step=".05" onChange={this.handleChange}></input>
                </div>
                <div className="cordOuter"
                        onClick={this.handleOutput}>
                            <div className="cordInner" id={"Output" + "inputInner"}>
                            </div>
                    </div> 
            </div>
        )
    }
}

class Recorder extends React.Component{
    constructor(props){
        super(props);

        this.state={
            audio: this.props.audioContext.createGain(),
            destination: this.props.audioContext.createMediaStreamDestination(),
            mediaRecorder: null,
            playing: false,
            finished: false,
            href: null,
        }

        this.handlePlay=this.handlePlay.bind(this);
        this.handleFinish=this.handleFinish.bind(this);
    }

    handlePlay(){
        if(this.state.playing){
            this.state.audio.gain.setTargetAtTime(0, this.props.audioContext.currentTime + .02, .02);
            setTimeout(() => {
                this.state.mediaRecorder.stop();
                this.setState({
                    playing: false,
                })
            }, 100);
        }else{
            this.state.audio.gain.setTargetAtTime(1, this.props.audioContext.currentTime + .04, .04);
            this.state.mediaRecorder.start();
            this.setState({
                playing: true,
                finished: false
            })
        }
        console.log(this.chunks);
    }

    handleFinish(){
        this.state.audio.gain.setTargetAtTime(0, this.props.audioContext.currentTime + .02, .02);
        setTimeout(() => {
            this.state.mediaRecorder.stop();
        }, 100);
        if(!this.state.finished){
            setTimeout(() => {
                let blob = new Blob(this.chunks, {"type": "audio/weba"});
                this.setState({
                    href: URL.createObjectURL(blob),
                    playing: false,
                    finished: true
         })
            }, 510);
            
        }
    }

    componentDidMount(){
        this.state.audio.connect(this.state.destination);
        this.state.audio.gain.setValueAtTime(0, this.props.audioContext.currentTime);
        let mr = new MediaRecorder(this.state.destination.stream, {mimeType: "audio/ogg"});
        mr.audioChannels = 2;
        this.chunks = [];
        mr.ondataavailable = event => {
            this.chunks.push(event.data);
        }
        this.setState({
            mediaRecorder: mr
        })
        this.props.createAudio(this.state.audio);
    }

    render(){
        return(
            <div id="RecorderDiv">
                <div id="recorderButtons">
                    <button id="recorderPlay" onClick={this.handlePlay}>{this.state.playing ? "Pause" : "Record"}</button>
                    <button id="recorderFinish" onClick={this.handleFinish}>Finish</button>
                </div>
                <a href={this.state.href} download="recordedAudio.weba"> Download Here</a>
            
            </div>
        )
    }
}

//patchcords with delete capability
class Cord extends React.Component{
    constructor(props){
        super(props);

        this.handleClick=this.handleClick.bind(this);
    }

    handleClick(){
        this.props.deleteCord(this.props.id);
    }

    render(){
        return(
            <line 
                x1={this.props.x1} 
                y1={this.props.y1} 
                x2={this.props.x2} 
                y2={this.props.y2}
                onClick={this.handleClick}></line>
        )
    }
}

//sidebar with buttons for creation
class SideButtons extends React.Component{
    constructor(props){
        super(props);
    }

    render(){
        return(
            <div id={this.props.id}>
                <MyButton name="Oscillator" handleClick={this.props.handleClick} inputOnly="true"/>
                <MyButton name="Gain" handleClick={this.props.handleClick} inputOnly="false"/>
                <MyButton name="Filter" handleClick={this.props.handleClick} inputOnly="false"/>
                <MyButton name="Panner" handleClick={this.props.handleClick} inputOnly="false"/>
                <MyButton name="ADSR" handleClick={this.props.handleClick} inputOnly="false"/>
                <MyButton name="Delay" handleClick={this.props.handleClick} inputOnly="false"/>
                <MyButton name="Distortion" handleClick={this.props.handleClick} inputOnly="false"/>
                <MyButton name="Reverb" handleClick={this.props.handleClick} inputOnly="false"/>
                <MyButton name="AudioInput" handleClick={this.props.handleClick} inputOnly="true" audioIn={this.props.audioIn}/>
                <MyButton name="Recorder" handleClick={this.props.handleClick} inputOnly="false"/>
            </div>
        )
        
    }
}

//buttons in side area that create modules for the playspace
class MyButton extends React.Component{
    constructor(props){
        super(props);

        this.state={
            count: 0
        }

        this.handleClick=this.handleClick.bind(this);
    }

    handleClick(){
        if(this.props.audioIn){
            return;
        }
        this.props.handleClick(this.props.name + " " + this.state.count, this.props.name, this.props.inputOnly)
        this.setState((state) => ({
            count: state.count + 1
        }))
    }


    render(){
        return(
            <button className="addBtn" onClick={this.handleClick}>{this.props.name}</button>
        )
    }
}

class Selector extends React.Component{
    constructor(props){
        super(props);

        this.state={
            val: this.props.values[0]
        }

        this.handleClick=this.handleClick.bind(this);
    }

    handleClick(event){
        this.setState({
            val: event.target.innerHTML
        })
        this.props.handleClick(event.target.innerHTML);
    }

    render(){
        return(
            <div id={this.props.id} className="selectorDiv">
                <span>{this.state.val}</span>
                <div id="selectorContent">
                    {this.props.values.map(el => {
                    return <div key={el} className="selectorVal" onClick={this.handleClick}>{el}</div>
                    })}
                </div>
            </div>
        )
    }
}


class Dial extends React.Component{
    constructor(props){
        super(props);

        this.state={
            value: 0,
            num: 0,
            rotPercent: 0,
        }

        this.handleChange=this.handleChange.bind(this);
        this.handleNumChange=this.handleNumChange.bind(this);
        this.handleNumSubmit=this.handleNumSubmit.bind(this);
    }

    handleChange(event){
        this.setState({
            value: event.target.value,
            num: Number((Math.pow(this.props.max, event.target.value)-1).toFixed(2)),
            rotPercent: event.target.value*180,
        })
        this.props.onChange(Math.pow(this.props.max, event.target.value) - 1);
    }

    handleNumChange(event){
        if(isNaN(event.target.value) && event.target.value!="0."){
            return;
        }
        this.setState({
            num: event.target.value
        })
    }

    handleNumSubmit(){
        let temp = this.state.num;
        if(temp > this.props.max-1){
            temp=this.props.max-1;
        }else if(temp < this.props.min){
            temp=this.props.min
        }
        this.setState({
            val: Math.log(temp)/Math.log(this.props.max),
            num: Number(Number(temp).toFixed(2)),
            rotPercent: (Math.log(temp)/Math.log(this.props.max))*180
        })
    }

    render(){
        let rotStyle= {
            background: `conic-gradient(from ${(this.state.rotPercent/Number.POSITIVE_INFINITY) - 90}deg, #fff, #555)`,
            transform: `rotate(${this.state.rotPercent}deg)`,   
        };

        return(
            <div className="dialWhole">
                <div id="dialKnob" className="tooltip">
                    <span id={this.props.name + "dialtip"} className="tooltiptext">{this.props.name}</span>
                    <input className="dialRange" value={this.state.value} type="range" min="0" max="1" step=".001" onChange={this.handleChange}></input>
                    <div id="dialEmpty" style={rotStyle}></div>
                </div>
                <input id="dialNumInput" value={this.state.num} type="text" onChange={this.handleNumChange} onKeyPress={event => {if(event.key == "Enter"){this.handleNumSubmit()}}}></input>

            </div>
        )
    }


}

class Slider extends React.Component{
    constructor(props){
        super(props);

        this.state={
            num: (this.props.max + this.props.min)/2,
            val: (this.props.max + this.props.min)/2
        }

        this.handleRangeChange=this.handleRangeChange.bind(this);
        this.handleNumChange=this.handleNumChange.bind(this);
        this.handleNumSubmit=this.handleNumSubmit.bind(this);
    }

    handleRangeChange(event){
        let val = event.target.value;
        if(val > this.props.max){
            val=this.props.max;
        }else if(val < this.props.min){
            val=this.props.min;
        }
        this.props.setAudio(val);
        this.setState({
            val: val,
            num: val
        });
    }

    handleNumChange(event){
        if(isNaN(event.target.value) && event.target.value!="-"){
            return;
        }
        this.setState({
            num: event.target.value
        })
    }

    handleNumSubmit(){
        let temp = this.state.num;
        if(temp > this.props.max){
            temp=this.props.max;
        }else if(temp < this.props.min){
            temp=this.props.min;
        }
        this.setState({
            val: temp,
            num: temp
        })
    }

    render(){
        return(
            <div id={this.props.labelName + "Div"} className="tooltip">
                    <input id={this.props.labelName + "Range"} type="range" value={this.state.val} min={this.props.min} max={this.props.max} step={this.props.step} onChange={this.handleRangeChange}></input>
                    <input id={this.props.labelName + "Number"} value={this.state.num} type="text" onChange={this.handleNumChange} onKeyPress={event => {if(event.key == "Enter"){this.handleNumSubmit()}}}></input>
                    <span id={this.props.labelName + "Span"} className="tooltiptext">{this.props.tooltipText}</span>
                </div>
        )
    }
}


class LogSlider extends React.Component{
    constructor(props){
        super(props);

        this.state={
            val: Number(Math.log(this.props.mid)/Math.log(this.props.max)),
            num: this.props.mid,
        }

        this.handleChange=this.handleChange.bind(this);
        this.handleNumChange=this.handleNumChange.bind(this);
        this.handleNumFreqChange=this.handleNumFreqChange.bind(this);
    }

    handleChange(event){
        this.setState({
            val: event.target.value,
            num: Number((Math.pow(this.props.max, event.target.value)-1).toFixed(2))
        })
        this.props.onChange(Number((Math.pow(this.props.max, event.target.value)-1).toFixed(2)));
    }

    handleNumChange(event){
        if(isNaN(event.target.value) && event.target.value!="0."){
            return;
        }
        this.setState({
            num: event.target.value
        })
    }

    handleNumFreqChange(){
        let temp = this.state.num;
        if(temp > this.props.max-1){
            temp=this.props.max - 1;
        }else if(temp < this.props.min){
            temp=this.props.min
        }
        this.setState({
            val: Math.log(Number(temp)+1)/Math.log(this.props.max-1),
            num: Number(Number(temp).toFixed(2)),
        })
        this.props.onChange(Number(Number(temp).toFixed(2)));
    }

    componentDidUpdate(prevProps){
        if(prevProps.mid !== this.props.mid){
            this.setState({          
                val: Number(Math.log(this.props.mid)/Math.log(this.props.max)),
                num: this.props.mid,
            });
        }
    }

    render(){

        return(
            <div id={this.props.labelName + "logSliderWhole"} className="tooltip">
                <input className={this.props.labelName + "freqNumRange"} value={this.state.val} type="range" min={Number(Math.log(this.props.min+1)/Math.log(this.props.max))} max={1} step="any" onChange={this.handleChange}></input>
                <input id={this.props.labelName + "freqNumInput"} value={this.state.num} type="text" onChange={this.handleNumChange} onKeyPress={event => {if(event.key == "Enter"){this.handleNumFreqChange()}}}></input>
                <span id={this.props.labelName + "logSliderFreqTip"} className="tooltiptext">{this.props.tooltipText}</span>
            </div>
        )
    }
}

class TextInput extends React.Component{
    constructor(props){
        super(props);

        this.state={
            val: this.props.defaultVal
        }

        this.handleChange=this.handleChange.bind(this);
        this.handleNumSubmit=this.handleNumSubmit.bind(this);
    }

    handleChange(event){
        if(isNaN(event.target.value) && event.target.value!="0."){
            return;
        }
        this.setState({
            val: event.target.value
        })
    }

    handleNumSubmit(){
        let temp = this.state.val;
        if(temp > this.props.max){
            temp=this.props.max;
            this.setState({val: this.props.max})
        }else if(temp<this.props.min){
            temp=this.props.min;
            this.setState({val: this.props.min})
        }
        this.props.onSubmit(this.props.tooltipText, Number(temp));
    }

    render(){
        return(
            <label id={this.props.labelName + "inputLabel"} className="tooltip">
                <input value={this.state.val} type="text" onChange={this.handleChange} onKeyPress={event => {if(event.key == "Enter"){this.handleNumSubmit()}}}></input>
                <span id={this.props.labelName + "Tip"} className="tooltiptext">{this.props.tooltipText}</span>
            </label>
        )
    }
}