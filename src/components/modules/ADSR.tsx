import { useRef, useState, useCallback } from 'react';
import LogSlider from '../ui/LogSlider';
import TextInput from '../ui/TextInput';
import { useAudioContext } from '../../audio/AudioContextProvider';
import { useParam } from '../../hooks/useParam';
import { useMIDILearn } from '../../midi/MIDILearnContext';
import { makeMIDILearnId } from '../../midi/midiUtils';
import type { ADSRModule } from '../../model/modules/ADSRModule';

interface ADSRProps {
    module: ADSRModule;
    parent: string;
}

function ADSR({ module, parent }: ADSRProps) {
    const audioContext = useAudioContext();
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [running, setRunning] = useState(false);
    const [rate, setRate] = useState(3000);
    const [attack, setAttack] = useParam(module.params.attack);
    const [decay, setDecay] = useParam(module.params.decay);
    const [sustain, setSustain] = useParam(module.params.sustain);
    const [release, setRelease] = useParam(module.params.release);
    const { learnMode, armedControl, armControl, isMapped } = useMIDILearn();

    const gateLearnId = makeMIDILearnId(parent, 'gate');
    const isGateArmed = learnMode && armedControl?.midiLearnId === gateLearnId;
    const isGateMapped = isMapped(gateLearnId);

    const handleAudio = useCallback(() => {
        const node = module.getNode() as GainNode;
        const current = audioContext.currentTime;
        node.gain.cancelScheduledValues(current);
        node.gain.setTargetAtTime(0.9, current + attack, attack);
        node.gain.setTargetAtTime(sustain, current + attack + decay, decay);
        node.gain.setTargetAtTime(0.001, current + attack + +decay + release, release);
    }, [audioContext, attack, decay, sustain, release, module]);

    const handleSlider = (val: number) => {
        const newRate = (1 / val) * 1000;
        setRate(newRate);

        if (running) {
            clearInterval(intervalRef.current!);
            intervalRef.current = setInterval(handleAudio, newRate);
        }
    };

    const handleToggle = () => {
        const node = module.getNode() as GainNode;
        const current = audioContext.currentTime;
        if (!running) {
            setRunning(true);
            intervalRef.current = setInterval(handleAudio, rate);
        } else {
            node.gain.setTargetAtTime(0, current + release, 0.5);
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

    const handleGateArm = () => {
        if (learnMode) {
            armControl(gateLearnId, true);
        }
    };

    const gateClass = isGateArmed ? 'midi-armed' : isGateMapped ? 'midi-mapped' : '';

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
                    <span className="tooltiptext">LFO Mode</span>
                </label>
                <button id="ADSRButton" onClick={handleAudio}>
                    Pulse
                </button>
                {learnMode && (
                    <button
                        id="ADSRGateButton"
                        className={gateClass}
                        onClick={handleGateArm}
                        title="MIDI Gate: arm this ADSR for note-on/off triggering"
                    >
                        Gate
                    </button>
                )}
                {!learnMode && isGateMapped && (
                    <span className="midi-badge" style={{ position: 'static', display: 'inline-block' }}>M</span>
                )}
            </div>
            <div id="ADSRControls">
                <TextInput
                    labelName="ADSRAttack"
                    tooltipText="Attack"
                    min={0}
                    max={5}
                    defaultVal={attack}
                    onSubmit={handleTextSubmit}
                ></TextInput>
                <TextInput
                    labelName="ADSRDecay"
                    tooltipText="Decay"
                    min={0}
                    max={5}
                    defaultVal={decay}
                    onSubmit={handleTextSubmit}
                ></TextInput>
                <TextInput
                    labelName="ADSRSustain"
                    tooltipText="Sustain"
                    min={0}
                    max={1}
                    defaultVal={sustain}
                    onSubmit={handleTextSubmit}
                ></TextInput>
                <TextInput
                    labelName="ADSRRelease"
                    tooltipText="Release"
                    min={0}
                    max={5}
                    defaultVal={release}
                    onSubmit={handleTextSubmit}
                ></TextInput>
            </div>
        </div>
    );
}

export default ADSR;
