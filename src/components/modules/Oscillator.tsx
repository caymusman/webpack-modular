import { useState } from 'react';
import Selector from '../ui/Selector';
import LogSlider from '../ui/LogSlider';
import Slider from '../ui/Slider';
import { makeParamKey } from '../../utils/moduleId';
import { getCenterPointFromEvent } from '../../utils/centerPoint';
import { makeMIDILearnId } from '../../midi/midiUtils';
import { useParam } from '../../hooks/useParam';
import { CordToData } from '../../types';
import type { OscillatorModule } from '../../model/modules/OscillatorModule';

interface OscillatorProps {
    module: OscillatorModule;
    parent: string;
    handleOutput: (info: CordToData) => void;
}

function Oscillator({ module, parent, handleOutput }: OscillatorProps) {
    const [, setWaveType] = useParam(module.params.waveType);
    const [frequency, setFrequency] = useParam(module.params.frequency);
    const [LFO, setLFO] = useParam(module.params.lfo);
    const [, setModDepth] = useParam(module.params.modDepth);

    const [min, setMin] = useState(LFO ? 0 : 20);
    const [max, setMax] = useState(LFO ? 21 : 20001);
    const [mid, setMid] = useState(LFO ? (frequency <= 21 ? frequency : 10) : frequency);

    const handleLFOClick = () => {
        if (LFO) {
            setMax(20001);
            setMin(20);
            setMid(440);
            setLFO(false);
            setFrequency(440);
        } else {
            setMax(21);
            setMin(0);
            setMid(10);
            setLFO(true);
            setFrequency(10);
        }
    };

    const onOutput = (event: React.MouseEvent | React.KeyboardEvent) => {
        const center = getCenterPointFromEvent(event);
        handleOutput({
            tomyKey: makeParamKey(parent),
            toLocation: center,
            audio: module.getParamNode()!,
        });
    };

    return (
        <div className="oscDiv">
            <div id="oscBoxOne">
                <Selector
                    id="waveSelector"
                    values={['sine', 'sawtooth', 'triangle']}
                    handleClick={(v: string) => setWaveType(v as typeof module.params.waveType.value)}
                />
                <label id="oscSlider" className="switch tooltip">
                    <input type="checkbox" onClick={handleLFOClick} aria-label="LFO Mode"></input>
                    <span className="slider round"></span>
                    <span className="tooltiptext">LFO Mode</span>
                </label>
            </div>
            <LogSlider
                labelName="oscFreq"
                tooltipText="Oscillator Frequency"
                min={min}
                max={max}
                mid={mid}
                onChange={setFrequency}
                midiLearnId={makeMIDILearnId(parent, 'frequency')}
            />
            <div
                className="cordOuter tooltip"
                id="firstParam"
                role="button"
                aria-label="Connect to frequency param"
                tabIndex={0}
                onClick={onOutput}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOutput(e);
                    }
                }}
            >
                <div className="cordInner" id={makeParamKey(parent) + ' inputInner'}>
                    <span className="tooltiptext">
                        <span className="paramSpan">param: </span>frequency
                    </span>
                </div>
            </div>
            <Slider labelName="oscModGain" tooltipText="Mod Depth" min={0} max={300} step={1} setAudio={setModDepth} midiLearnId={makeMIDILearnId(parent, 'modDepth')} />
        </div>
    );
}

export default Oscillator;
