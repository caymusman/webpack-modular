import { useRef, useState, useEffect } from 'react';
import Selector from '../ui/Selector';
import LogSlider from '../ui/LogSlider';
import Slider from '../ui/Slider';
import { makeParamKey } from '../../utils/moduleId';
import { getCenterPointFromEvent } from '../../utils/centerPoint';
import { setNodeType } from '../../audio/nodeHelpers';
import { createOscillatorNode, createGainNode } from '../../audio/nodeFactories';
import { useAudioContext } from '../../audio/AudioContextProvider';
import { CordToData } from '../../types';

interface OscillatorProps {
    createAudio: (node: AudioNode) => void;
    parent: string;
    handleOutput: (info: CordToData) => void;
}

function Oscillator({ createAudio, parent, handleOutput }: OscillatorProps) {
    const audioContext = useAudioContext();
    const audio = useRef(createOscillatorNode(audioContext));
    const modulatorGain = useRef(createGainNode(audioContext));
    const [min, setMin] = useState(20);
    const [max, setMax] = useState(20001);
    const [mid, setMid] = useState(440);
    const [LFO, setLFO] = useState(false);

    useEffect(() => {
        const oscNode = audio.current;
        const modGainNode = modulatorGain.current;
        createAudio(oscNode);
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

    const setFreq = (val: number) => {
        audio.current.frequency.setValueAtTime(Number(val), audioContext.currentTime);
    };

    const handleWaveChange = (w: string) => {
        setNodeType(audio.current, w);
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

    const onOutput = (event: React.MouseEvent | React.KeyboardEvent) => {
        const center = getCenterPointFromEvent(event);
        handleOutput({
            tomyKey: makeParamKey(parent),
            toLocation: center,
            audio: modulatorGain.current,
        });
    };

    const setModDepth = (val: number) => {
        modulatorGain.current.gain.setValueAtTime(val, audioContext.currentTime);
    };

    return (
        <div className="oscDiv">
            <div id="oscBoxOne">
                <Selector id="waveSelector" values={['sine', 'sawtooth', 'triangle']} handleClick={handleWaveChange} />
                <label id="oscSlider" className="switch tooltip">
                    <input type="checkbox" onClick={handleLFOClick} aria-label="LFO Mode"></input>
                    <span className="slider round"></span>
                    <span className="tooltiptext">
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
            <div className="cordOuter tooltip" id="firstParam" role="button" aria-label="Connect to frequency param" tabIndex={0} onClick={onOutput} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOutput(e); } }}>
                <div className="cordInner" id={makeParamKey(parent) + ' inputInner'}>
                    <span className="tooltiptext">
                        <span className="paramSpan">param: </span>frequency
                    </span>
                </div>
            </div>
            <Slider labelName="oscModGain" tooltipText="Mod Depth" min={0} max={300} step={1} setAudio={setModDepth} />
        </div>
    );
}

export default Oscillator;
