import Slider from '../ui/Slider';
import { useParam } from '../../hooks/useParam';
import type { CompressorModule } from '../../model/modules/CompressorModule';

interface CompressorProps {
    module: CompressorModule;
}

function Compressor({ module }: CompressorProps) {
    const [threshold, setThreshold] = useParam(module.params.threshold);
    const [knee, setKnee] = useParam(module.params.knee);
    const [ratio, setRatio] = useParam(module.params.ratio);
    const [attack, setAttack] = useParam(module.params.attack);
    const [release, setRelease] = useParam(module.params.release);

    return (
        <div className="compressorDiv">
            <Slider labelName="compThreshold" tooltipText="Threshold (dB)" min={-100} max={0} step={0.1} setAudio={setThreshold} initialValue={threshold} />
            <Slider labelName="compKnee" tooltipText="Knee (dB)" min={0} max={40} step={0.1} setAudio={setKnee} initialValue={knee} />
            <Slider labelName="compRatio" tooltipText="Ratio" min={1} max={20} step={0.1} setAudio={setRatio} initialValue={ratio} />
            <Slider labelName="compAttack" tooltipText="Attack (s)" min={0} max={1} step={0.001} setAudio={setAttack} initialValue={attack} />
            <Slider labelName="compRelease" tooltipText="Release (s)" min={0} max={1} step={0.001} setAudio={setRelease} initialValue={release} />
        </div>
    );
}

export default Compressor;
