import Selector from '../ui/Selector';
import LogSlider from '../ui/LogSlider';
import Slider from '../ui/Slider';
import { useParam } from '../../hooks/useParam';
import type { LFOModule } from '../../model/modules/LFOModule';

interface LFOProps {
    module: LFOModule;
}

function LFO({ module }: LFOProps) {
    const [, setWaveType] = useParam(module.params.waveType);
    const [, setRate] = useParam(module.params.rate);
    const [, setDepth] = useParam(module.params.depth);

    return (
        <div className="lfoDiv">
            <Selector
                id="lfoWaveSelector"
                values={['sine', 'triangle', 'sawtooth', 'square']}
                handleClick={(v) => setWaveType(v as typeof module.params.waveType.value)}
            />
            <LogSlider
                labelName="lfoRate"
                tooltipText="Rate (Hz)"
                min={0.01}
                max={21}
                mid={1}
                onChange={setRate}
            />
            <Slider
                labelName="lfoDepth"
                tooltipText="Depth"
                min={0}
                max={1000}
                step={1}
                setAudio={setDepth}
            />
        </div>
    );
}

export default LFO;
