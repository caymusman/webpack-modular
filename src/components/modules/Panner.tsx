import Slider from '../ui/Slider';
import { useParam } from '../../hooks/useParam';
import type { PannerModule } from '../../model/modules/PannerModule';

interface PannerProps {
    module: PannerModule;
}

function Panner({ module }: PannerProps) {
    const [, setPan] = useParam(module.params.pan);

    return (
        <div>
            <Slider labelName="panPan" tooltipText="Pan" min={-1} max={1} step={0.001} setAudio={setPan}></Slider>
        </div>
    );
}

export default Panner;
