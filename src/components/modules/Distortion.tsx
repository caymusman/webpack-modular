import Slider from '../ui/Slider';
import Selector from '../ui/Selector';
import { makeMIDILearnId } from '../../midi/midiUtils';
import { useParam } from '../../hooks/useParam';
import type { DistortionModule } from '../../model/modules/DistortionModule';

interface DistortionProps {
    module: DistortionModule;
    parent: string;
}

function Distortion({ module, parent }: DistortionProps) {
    const [, setCurve] = useParam(module.params.curve);
    const [, setOversample] = useParam(module.params.oversample);

    return (
        <div>
            <Slider
                labelName="distortionCurve"
                tooltipText="Distortion Curve"
                min={50}
                max={800}
                step={0.1}
                setAudio={setCurve}
                midiLearnId={makeMIDILearnId(parent, 'curve')}
            ></Slider>
            <Selector
                id="distortionSelector"
                values={['none', '2x', '4x']}
                handleClick={(v: string) => setOversample(v as typeof module.params.oversample.value)}
            />
        </div>
    );
}

export default Distortion;
