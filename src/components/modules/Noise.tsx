import Selector from '../ui/Selector';
import Slider from '../ui/Slider';
import { useParam } from '../../hooks/useParam';
import type { NoiseModule } from '../../model/modules/NoiseModule';

interface NoiseProps {
    module: NoiseModule;
}

function Noise({ module }: NoiseProps) {
    const [, setGain] = useParam(module.params.gain);

    const handleTypeChange = (type: string) => {
        module.switchNoiseType(type as typeof module.params.noiseType.value);
    };

    return (
        <div className="noiseDiv">
            <Selector
                id="noiseSelector"
                values={['white', 'pink', 'brown']}
                handleClick={handleTypeChange}
            />
            <Slider
                labelName="noiseGain"
                tooltipText="Level"
                min={0}
                max={1}
                step={0.01}
                setAudio={setGain}
            />
        </div>
    );
}

export default Noise;
