import Slider from '../ui/Slider';
import { makeMIDILearnId } from '../../midi/midiUtils';
import { useParam } from '../../hooks/useParam';
import type { DelayModule } from '../../model/modules/DelayModule';

interface DelayProps {
    module: DelayModule;
    parent: string;
}

function Delay({ module, parent }: DelayProps) {
    const [, setDelayTime] = useParam(module.params.delayTime);

    return (
        <div id="delayDiv">
            <Slider
                labelName="delayDelayTime"
                tooltipText="Delay Time (s)"
                min={0}
                max={5}
                step={0.01}
                setAudio={setDelayTime}
                midiLearnId={makeMIDILearnId(parent, 'delayTime')}
            ></Slider>
        </div>
    );
}

export default Delay;
