import { ChangeEvent, useState } from 'react';
import { makeParamKey } from '../../utils/moduleId';
import { getCenterPointFromEvent } from '../../utils/centerPoint';
import { useParam } from '../../hooks/useParam';
import { CordToData } from '../../types';
import type { GainModule } from '../../model/modules/GainModule';

interface GainProps {
    module: GainModule;
    parent: string;
    handleOutput: (info: CordToData) => void;
}

function Gain({ module, parent, handleOutput }: GainProps) {
    const [gain, setGain] = useParam(module.params.gain);
    const [num, setNum] = useState<string | number>(gain);
    const max = 1;
    const min = 0;

    const handleGainChange = (event: ChangeEvent<HTMLInputElement>) => {
        let gainVal: number = Number(event.target.value);
        if (gainVal > 1) {
            gainVal = 1;
        } else if (gainVal < 0) {
            gainVal = 0;
        }
        setGain(gainVal);
        setNum(gainVal);
    };

    const handleNumChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (isNaN(Number(event.target.value))) {
            return;
        }
        setNum(event.target.value);
    };

    const handleNumGainChange = () => {
        let temp: number = Number(num);
        if (temp > max) {
            temp = max;
        } else if (temp < min) {
            temp = min;
        }
        setGain(temp);
        setNum(temp);
    };

    const onOutput = (event: React.MouseEvent | React.KeyboardEvent) => {
        const center = getCenterPointFromEvent(event);
        handleOutput({
            tomyKey: makeParamKey(parent),
            toLocation: center,
            audio: module.getParamNode()!,
        });
    };

    return (
        <div className="gainDiv">
            <input
                id="gainRangeInput"
                type="range"
                value={gain}
                min="0"
                max="1"
                step=".01"
                onChange={handleGainChange}
                aria-label="Gain"
            ></input>
            <input
                id="gainNumInput"
                value={num}
                type="text"
                onChange={handleNumChange}
                aria-label="Gain value"
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        handleNumGainChange();
                    }
                }}
            ></input>

            <div
                className="cordOuter tooltip"
                id="firstParam"
                role="button"
                aria-label="Connect to gain param"
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
                        <span className="paramSpan">param: </span>gain
                    </span>
                </div>
            </div>
        </div>
    );
}

export default Gain;
