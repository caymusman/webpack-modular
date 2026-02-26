import { useParam } from '../../hooks/useParam';
import Slider from '../ui/Slider';
import { makeMIDILearnId } from '../../midi/midiUtils';
import type { BitcrusherModule } from '../../model/modules/BitcrusherModule';

interface BitcrusherViewProps {
    module: BitcrusherModule;
    parent: string;
}

export default function BitcrusherView({ module, parent }: BitcrusherViewProps) {
    const [bits, setBits] = useParam(module.params.bits);

    return (
        <div>
            <Slider
                labelName="bitDepth"
                tooltipText="Bit depth"
                min={1}
                max={16}
                step={1}
                setAudio={setBits}
                initialValue={bits}
                midiLearnId={makeMIDILearnId(parent, 'bits')}
            />
        </div>
    );
}
