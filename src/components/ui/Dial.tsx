import { ChangeEvent, useState } from 'react';
import { useMIDILearn } from '../../midi/MIDILearnContext';

interface DialProps {
    name: string;
    min: number;
    max: number;
    onChange: (val: number) => void;
    midiLearnId?: string;
}

function Dial({ name, min, max, onChange, midiLearnId }: DialProps) {
    const [value, setValue] = useState<string | number>(0);
    const [num, setNum] = useState<string | number>(0);
    const [rotPercent, setRotPercent] = useState(0);
    const { learnMode, armedControl, armControl, isMapped } = useMIDILearn();

    const isArmed = learnMode && armedControl?.midiLearnId === midiLearnId;
    const isMappedControl = midiLearnId ? isMapped(midiLearnId) : false;

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);
        setNum(Number((Math.pow(max, Number(event.target.value)) - 1).toFixed(2)));
        setRotPercent(Number(event.target.value) * 180);
        onChange(Math.pow(max, Number(event.target.value)) - 1);
    };

    const handleNumChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (isNaN(Number(event.target.value)) && event.target.value !== '0.') {
            return;
        }
        setNum(event.target.value);
    };

    const handleNumSubmit = () => {
        let temp: number = Number(num);
        if (temp > max - 1) {
            temp = max - 1;
        } else if (temp < min) {
            temp = min;
        }
        setValue(Math.log(temp) / Math.log(max));
        setNum(Number(temp.toFixed(2)));
        setRotPercent((Math.log(temp) / Math.log(max)) * 180);
    };

    const handleArm = () => {
        if (learnMode && midiLearnId) {
            armControl(midiLearnId);
        }
    };

    const rotStyle = {
        background: `conic-gradient(from ${rotPercent / Number.POSITIVE_INFINITY - 90}deg, #fff, #555)`,
        transform: `rotate(${rotPercent}deg)`,
    };

    const extraClass = isArmed ? ' midi-armed' : isMappedControl ? ' midi-mapped' : '';
    const learnProps = learnMode && midiLearnId
        ? {
              tabIndex: 0,
              role: 'button' as const,
              'aria-label': `Arm ${name} for MIDI learn`,
              onKeyDown: (e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleArm();
                  }
              },
          }
        : {};

    return (
        <div className={'dialWhole' + extraClass} onClick={handleArm} {...learnProps}>
            {isMappedControl && !learnMode && <span className="midi-badge">M</span>}
            <div id="dialKnob" className="tooltip">
                <span className="tooltiptext">{name}</span>
                <input
                    className="dialRange"
                    value={value}
                    type="range"
                    min="0"
                    max="1"
                    step=".001"
                    onChange={handleChange}
                    aria-label={name}
                ></input>
                <div id="dialEmpty" style={rotStyle}></div>
            </div>
            <input
                id="dialNumInput"
                value={num}
                type="text"
                onChange={handleNumChange}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        handleNumSubmit();
                    }
                }}
                aria-label={name + ' value'}
            ></input>
        </div>
    );
}

export default Dial;
