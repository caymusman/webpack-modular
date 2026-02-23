import Selector from '../ui/Selector';
import Dial from '../ui/Dial';
import Slider from '../ui/Slider';
import LogSlider from '../ui/LogSlider';
import { makeMIDILearnId } from '../../midi/midiUtils';
import { useParam } from '../../hooks/useParam';
import type { FilterModule } from '../../model/modules/FilterModule';

interface FilterProps {
    module: FilterModule;
    parent: string;
}

function Filter({ module, parent }: FilterProps) {
    const [, setFilterType] = useParam(module.params.filterType);
    const [, setFreq] = useParam(module.params.frequency);
    const [, setQ] = useParam(module.params.q);
    const [, setGain] = useParam(module.params.gain);

    const filterTypes = ['lowpass', 'highpass', 'bandpass', 'lowshelf', 'highshelf', 'peaking', 'notch', 'allpass'];
    return (
        <div className="filterDiv">
            <div id="filterBoxOne">
                <Selector
                    id="filterSelector"
                    values={filterTypes}
                    handleClick={(v: string) => setFilterType(v as typeof module.params.filterType.value)}
                />
                <Dial min={0} max={1001} name="Q" onChange={setQ} midiLearnId={makeMIDILearnId(parent, 'q')} />
            </div>
            <Slider
                labelName="filterGain"
                tooltipText="Filter Gain"
                min={-40}
                max={40}
                step={0.01}
                setAudio={setGain}
                midiLearnId={makeMIDILearnId(parent, 'gain')}
            />
            <LogSlider
                labelName="filterFreq"
                tooltipText="Filter Frequency"
                min={0}
                max={20001}
                mid={440}
                onChange={setFreq}
                midiLearnId={makeMIDILearnId(parent, 'frequency')}
            />
        </div>
    );
}

export default Filter;
