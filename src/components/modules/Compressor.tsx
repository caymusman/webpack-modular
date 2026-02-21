import Slider from '../ui/Slider';
import { useParam } from '../../hooks/useParam';
import type { CompressorModule } from '../../model/modules/CompressorModule';

interface CompressorProps {
    module: CompressorModule;
}

function Compressor({ module }: CompressorProps) {
    const [, setThreshold] = useParam(module.params.threshold);
    const [, setKnee] = useParam(module.params.knee);
    const [, setRatio] = useParam(module.params.ratio);
    const [, setAttack] = useParam(module.params.attack);
    const [, setRelease] = useParam(module.params.release);

    return (
        <div className="compressorDiv">
            <Slider labelName="compThreshold" tooltipText="Threshold (dB)" min={-100} max={0} step={0.1} setAudio={setThreshold} />
            <Slider labelName="compKnee" tooltipText="Knee (dB)" min={0} max={40} step={0.1} setAudio={setKnee} />
            <Slider labelName="compRatio" tooltipText="Ratio" min={1} max={20} step={0.1} setAudio={setRatio} />
            <Slider labelName="compAttack" tooltipText="Attack (s)" min={0} max={1} step={0.001} setAudio={setAttack} />
            <Slider labelName="compRelease" tooltipText="Release (s)" min={0} max={1} step={0.001} setAudio={setRelease} />
        </div>
    );
}

export default Compressor;
