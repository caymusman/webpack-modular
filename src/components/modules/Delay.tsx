import Slider from '../ui/Slider';
import { useParam } from '../../hooks/useParam';
import type { DelayModule } from '../../model/modules/DelayModule';

interface DelayProps {
    module: DelayModule;
}

function Delay({ module }: DelayProps) {
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
            ></Slider>
        </div>
    );
}

export default Delay;
