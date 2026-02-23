import { ChangeEvent, useState } from 'react';
import { useMIDILearn } from '../../midi/MIDILearnContext';

interface SliderProps {
    labelName: string;
    tooltipText: string;
    min: number;
    max: number;
    step: number;
    setAudio: (val: number) => void;
    midiLearnId?: string;
}

function Slider({ labelName, tooltipText, min, max, step, setAudio, midiLearnId }: SliderProps) {
    const [num, setNum] = useState<string | number>((max + min) / 2);
    const [val, setVal] = useState<string | number>((max + min) / 2);
    const { learnMode, armedControl, armControl, isMapped } = useMIDILearn();

    const isArmed = learnMode && armedControl?.midiLearnId === midiLearnId;
    const isMappedControl = midiLearnId ? isMapped(midiLearnId) : false;

    const handleRangeChange = (event: ChangeEvent<HTMLInputElement>) => {
        let v: number = Number(event.target.value);
        if (v > max) {
            v = max;
        } else if (v < min) {
            v = min;
        }
        setAudio(v);
        setVal(v);
        setNum(v);
    };

    const handleNumChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (isNaN(Number(event.target.value)) && event.target.value !== '-') {
            return;
        }
        setNum(event.target.value);
    };

    const handleNumSubmit = () => {
        let temp: number = Number(num);
        if (temp > max) {
            temp = max;
        } else if (temp < min) {
            temp = min;
        }
        setVal(temp);
        setNum(temp);
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
        <div id={labelName + 'Div'} className={'tooltip' + extraClass} onClick={handleArm} {...learnProps}>
            {isMappedControl && !learnMode && <span className="midi-badge">M</span>}
            <input
                id={labelName + 'Range'}
                type="range"
                value={val}
                min={min}
                max={max}
                step={step}
                onChange={handleRangeChange}
                aria-label={tooltipText}
            ></input>
            <input
                id={labelName + 'Number'}
                value={num}
                type="text"
                onChange={handleNumChange}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        handleNumSubmit();
                    }
                }}
                aria-label={tooltipText + ' value'}
            ></input>
            <span className="tooltiptext">{tooltipText}</span>
        </div>
    );
}

export default Slider;
