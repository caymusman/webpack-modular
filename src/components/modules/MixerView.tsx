import { useParam } from '../../hooks/useParam';
import Slider from '../ui/Slider';
import { getCenterPointFromEvent } from '../../utils/centerPoint';
import { makeParamKey } from '../../utils/moduleId';
import { makeMIDILearnId } from '../../midi/midiUtils';
import { CordToData } from '../../types';
import type { MixerModule } from '../../model/modules/MixerModule';

interface MixerViewProps {
    module: MixerModule;
    parent: string;
    handleOutput: (info: CordToData) => void;
}

export default function MixerView({ module, parent, handleOutput }: MixerViewProps) {
    const [level, setLevel] = useParam(module.params.level);

    const onOutput = (event: React.MouseEvent | React.KeyboardEvent) => {
        const center = getCenterPointFromEvent(event);
        handleOutput({
            tomyKey: makeParamKey(parent),
            toLocation: center,
            audio: module.getParamNode()!,
        });
    };

    return (
        <div>
            <Slider
                labelName="mixerLevel"
                tooltipText="Mixer level"
                min={0}
                max={2}
                step={0.01}
                setAudio={setLevel}
                initialValue={level}
                midiLearnId={makeMIDILearnId(parent, 'level')}
            />
            <div
                className="cordOuter tooltip"
                id="firstParam"
                role="button"
                aria-label="Connect to level param"
                tabIndex={0}
                onClick={onOutput}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOutput(e);
                    }
                }}
            >
                <div className="cordInner" id={makeParamKey(parent) + ' inputInner'}>
                    <span className="tooltiptext">
                        <span className="paramSpan">param: </span>level
                    </span>
                </div>
            </div>
        </div>
    );
}
