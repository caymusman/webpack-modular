import { useRef, useState, useEffect } from 'react';
import Selector from '../ui/Selector';
import LogSlider from '../ui/LogSlider';
import Slider from '../ui/Slider';

function Oscillator({ audioContext, createAudio, parent, handleOutput }) {
    const audio = useRef(audioContext.createOscillator());
    const modulatorGain = useRef(audioContext.createGain());
    const [min, setMin] = useState(20);
    const [max, setMax] = useState(20001);
    const [mid, setMid] = useState(440);
    const [LFO, setLFO] = useState(false);

    useEffect(() => {
        const oscNode = audio.current;
        const modGainNode = modulatorGain.current;
        createAudio(oscNode);
        oscNode.frequency.setValueAtTime(440, audioContext.currentTime);
        modGainNode.connect(oscNode.frequency);
        oscNode.start();

        return () => {
            try {
                oscNode.stop();
            } catch (_e) {
                /* oscillator may already be stopped */
            }
            oscNode.disconnect();
            modGainNode.disconnect();
        };
    }, [createAudio, audioContext]);

    const setFreq = (val) => {
        audio.current.frequency.setValueAtTime(Number(val), audioContext.currentTime);
    };

    const handleWaveChange = (w) => {
        audio.current.type = w;
    };

    const handleLFOClick = () => {
        if (LFO) {
            setMax(20001);
            setMin(20);
            setMid(440);
            setLFO(false);
            audio.current.frequency.setValueAtTime(440, audioContext.currentTime);
        } else {
            setMax(21);
            setMin(0);
            setMid(10);
            setLFO(true);
            audio.current.frequency.setValueAtTime(10, audioContext.currentTime);
        }
    };

    const onOutput = (event) => {
        const largerDim = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth;
        const el = event.target.getBoundingClientRect();
        const x = el.x;
        const y = el.y;
        const bottom = el.bottom;
        const right = el.right;
        const xCenter = (right - x) / 2 + x - largerDim * 0.04;
        const yCenter = (bottom - y) / 2 + y - largerDim * 0.04;

        handleOutput({
            tomyKey: parent + ' param',
            toLocation: { x: xCenter, y: yCenter },
            audio: modulatorGain.current,
        });
    };

    const setModDepth = (val) => {
        modulatorGain.current.gain.setValueAtTime(val, audioContext.currentTime);
    };

    return (
        <div className="oscDiv">
            <div id="oscBoxOne">
                <Selector id="waveSelector" values={['sine', 'sawtooth', 'triangle']} handleClick={handleWaveChange} />
                <label id="oscSlider" className="switch tooltip">
                    <input type="checkbox" onClick={handleLFOClick}></input>
                    <span className="slider round"></span>
                    <span id="oscLFOTip" className="tooltiptext">
                        LFO Mode
                    </span>
                </label>
            </div>
            <LogSlider
                labelName="oscFreq"
                tooltipText="Oscillator Frequency"
                min={min}
                max={max}
                mid={mid}
                onChange={setFreq}
            />
            <div className="cordOuter tooltip" id="firstParam" onClick={onOutput}>
                <div className="cordInner" id={parent + ' param' + ' inputInner'}>
                    <div id="ttWrapper">
                        <span id="oscDetuneParamTip" className="tooltiptext">
                            <span className="paramSpan">param: </span>frequency
                        </span>
                    </div>
                </div>
            </div>
            <Slider labelName="oscModGain" tooltipText="Mod Depth" min={0} max={300} mid={150} setAudio={setModDepth} />
        </div>
    );
}

export default Oscillator;
