import { ChangeEvent, useState } from 'react';
import { useMIDILearn } from '../../midi/MIDILearnContext';

interface LogSliderProps {
    labelName: string;
    tooltipText: string;
    min: number;
    max: number;
    mid: number;
    onChange: (val: number) => void;
    midiLearnId?: string;
}

function LogSlider({ labelName, tooltipText, min, max, mid, onChange, midiLearnId }: LogSliderProps) {
    const [val, setVal] = useState<string | number>(Number(Math.log(mid) / Math.log(max)));
    const [num, setNum] = useState<string | number>(mid);
    const [prevMid, setPrevMid] = useState(mid);
    const { learnMode, armedControl, armControl, isMapped } = useMIDILearn();

    // Adjust state when mid prop changes (React-recommended pattern)
    if (mid !== prevMid) {
        setPrevMid(mid);
        setVal(Number(Math.log(mid) / Math.log(max)));
        setNum(mid);
    }

    const isArmed = learnMode && armedControl?.midiLearnId === midiLearnId;
    const isMappedControl = midiLearnId ? isMapped(midiLearnId) : false;

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setVal(event.target.value);
        setNum(Number((Math.pow(max, Number(event.target.value)) - 1).toFixed(2)));
        onChange(Number((Math.pow(max, Number(event.target.value)) - 1).toFixed(2)));
    };

    const handleNumChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (isNaN(Number(event.target.value)) && event.target.value !== '0.') {
            return;
        }
        setNum(event.target.value);
    };

    const handleNumFreqChange = () => {
        let temp: number = Number(num);
        if (temp > max - 1) {
            temp = max - 1;
        } else if (temp < min) {
            temp = min;
        }
        setVal(Math.log(Number(temp) + 1) / Math.log(max - 1));
        setNum(Number(Number(temp).toFixed(2)));
        onChange(Number(Number(temp).toFixed(2)));
    };

    const handleArm = () => {
        if (learnMode && midiLearnId) {
            armControl(midiLearnId);
        }
    };

    const extraClass = isArmed ? ' midi-armed' : isMappedControl ? ' midi-mapped' : '';
    const learnProps = learnMode && midiLearnId
        ? {
              tabIndex: 0,
              role: 'button' as const,
              'aria-label': `Arm ${tooltipText} for MIDI learn`,
              onKeyDown: (e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleArm();
                  }
              },
          }
        : {};

    return (
        <div id={labelName + 'logSliderWhole'} className={'tooltip' + extraClass} onClick={handleArm} {...learnProps}>
            {isMappedControl && !learnMode && <span className="midi-badge">M</span>}
            <input
                className={labelName + 'freqNumRange'}
                value={val}
                type="range"
                min={Number(Math.log(min + 1) / Math.log(max))}
                max={1}
                step="any"
                onChange={handleChange}
                aria-label={tooltipText}
            ></input>
            <input
                id={labelName + 'freqNumInput'}
                value={num}
                type="text"
                onChange={handleNumChange}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        handleNumFreqChange();
                    }
                }}
                aria-label={tooltipText + ' value'}
            ></input>
            <span className="tooltiptext">{tooltipText}</span>
        </div>
    );
}

export default LogSlider;
