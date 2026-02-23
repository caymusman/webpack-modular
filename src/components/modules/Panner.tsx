import Slider from '../ui/Slider';
import { makeMIDILearnId } from '../../midi/midiUtils';
import { useParam } from '../../hooks/useParam';
import type { PannerModule } from '../../model/modules/PannerModule';

interface PannerProps {
    module: PannerModule;
    parent: string;
}

function Panner({ module, parent }: PannerProps) {
    const [, setPan] = useParam(module.params.pan);

    return (
        <div>
            <Slider
                labelName="panPan"
                tooltipText="Pan"
                min={-1}
                max={1}
                step={0.001}
                setAudio={setPan}
                midiLearnId={makeMIDILearnId(parent, 'pan')}
            ></Slider>
        </div>
    );
}

export default Panner;
