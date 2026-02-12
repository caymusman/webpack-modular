import { useRef, useState, useEffect, useCallback } from 'react';
import LogSlider from '../ui/LogSlider';
import TextInput from '../ui/TextInput';
import { createGainNode } from '../../audio/nodeFactories';
import { useAudioContext } from '../../audio/AudioContextProvider';

interface ADSRProps {
    createAudio: (node: AudioNode) => void;
}

function ADSR({ createAudio }: ADSRProps) {
    const audioContext = useAudioContext();
    const audio = useRef(createGainNode(audioContext, 0));
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [running, setRunning] = useState(false);
    const [rate, setRate] = useState(3000);
    const [attack, setAttack] = useState(0.2);
    const [decay, setDecay] = useState(0.2);
    const [sustain, setSustain] = useState(0.6);
    const [release, setRelease] = useState(0.3);

    useEffect(() => {
        const audioNode = audio.current;
        createAudio(audioNode);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            audioNode.disconnect();
        };
    }, [createAudio, audioContext]);

    const handleAudio = useCallback(() => {
        const current = audioContext.currentTime;
        audio.current.gain.cancelScheduledValues(current);
        audio.current.gain.setTargetAtTime(0.9, current + attack, attack);
        audio.current.gain.setTargetAtTime(sustain, current + attack + decay, decay);
        audio.current.gain.setTargetAtTime(0.001, current + attack + +decay + release, release);
    }, [audioContext, attack, decay, sustain, release]);

    const handleSlider = (val: number) => {
        const newRate = (1 / val) * 1000;
        setRate(newRate);

        if (running) {
            clearInterval(intervalRef.current!);
            intervalRef.current = setInterval(handleAudio, newRate);
        }
    };

    const handleToggle = () => {
        const current = audioContext.currentTime;
        if (!running) {
            setRunning(true);
            intervalRef.current = setInterval(handleAudio, rate);
        } else {
            audio.current.gain.setTargetAtTime(0, current + release, 0.5);
            clearInterval(intervalRef.current!);
            setRunning(false);
        }
    };

    const handleTextSubmit = (name: string, num: number) => {
        switch (name) {
            case 'Attack':
                setAttack(num);
                break;
            case 'Decay':
                setDecay(num);
                break;
            case 'Sustain':
                setSustain(num);
                break;
            case 'Release':
                setRelease(num);
                break;
            default:
                return;
        }
    };

    return (
        <div id="ADSRDiv">
            <LogSlider
                labelName="ADSRSlider"
                tooltipText="LFO Rate"
                min={0}
                max={21}
                mid={10}
                onChange={handleSlider}
            ></LogSlider>
            <div id="ADSRBox">
                <label id="ADSRCheck" className="switch tooltip">
                    <input type="checkbox" onClick={handleToggle} aria-label="LFO Mode"></input>
                    <span className="slider round"></span>
                    <span id="ADSRCheckTip" className="tooltiptext">
                        LFO Mode
                    </span>
                </label>
                <button id="ADSRButton" onClick={handleAudio}>
                    Pulse
                </button>
            </div>
            <div id="ADSRControls">
                <TextInput
                    labelName="ADSRAttack"
                    tooltipText="Attack"
                    min={0}
                    max={5}
                    defaultVal={0.2}
                    onSubmit={handleTextSubmit}
                ></TextInput>
                <TextInput
                    labelName="ADSRDecay"
                    tooltipText="Decay"
                    min={0}
                    max={5}
                    defaultVal={0.2}
                    onSubmit={handleTextSubmit}
                ></TextInput>
                <TextInput
                    labelName="ADSRSustain"
                    tooltipText="Sustain"
                    min={0}
                    max={1}
                    defaultVal={0.5}
                    onSubmit={handleTextSubmit}
                ></TextInput>
                <TextInput
                    labelName="ADSRRelease"
                    tooltipText="Release"
                    min={0}
                    max={5}
                    defaultVal={0.3}
                    onSubmit={handleTextSubmit}
                ></TextInput>
            </div>
        </div>
    );
}

export default ADSR;
