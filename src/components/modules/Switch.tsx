import { useEffect, useRef } from 'react';
import Selector from '../ui/Selector';
import { makeParamKey } from '../../utils/moduleId';
import { getCenterPointFromEvent } from '../../utils/centerPoint';
import { useParam } from '../../hooks/useParam';
import { CordToData } from '../../types';
import type { SwitchModule } from '../../model/modules/SwitchModule';

interface SwitchProps {
    module: SwitchModule;
    parent: string;
    handleOutput: (info: CordToData) => void;
    onRemoveCords?: (tomyKeys: string[]) => void;
}

const CHANNEL_LABELS = ['A', 'B', 'C', 'D'];

function Switch({ module, parent, handleOutput, onRemoveCords }: SwitchProps) {
    const [activeChannel, setActiveChannel] = useParam(module.params.activeChannel);
    const [channelCount, setChannelCount] = useParam(module.params.channelCount);
    const [rate, setRate] = useParam(module.params.rate);
    const count = Math.round(channelCount);
    const active = Math.round(activeChannel);

    // Remove cords to channels that no longer exist when count decreases
    const prevCountRef = useRef(count);
    useEffect(() => {
        const prev = prevCountRef.current;
        if (count < prev && onRemoveCords) {
            const removed: string[] = [];
            for (let i = count; i < prev; i++) {
                removed.push(parent + '|ch' + i);
            }
            onRemoveCords(removed);
        }
        prevCountRef.current = count;
    }, [count, parent, onRemoveCords]);

    const onChannelOutput = (e: React.MouseEvent | React.KeyboardEvent, i: number) => {
        const center = getCenterPointFromEvent(e);
        handleOutput({
            tomyKey: parent + '|ch' + i,
            toLocation: center,
            audio: module.getChannelGain(i),
        });
    };

    const onCVOutput = (e: React.MouseEvent | React.KeyboardEvent) => {
        const center = getCenterPointFromEvent(e);
        handleOutput({
            tomyKey: makeParamKey(parent),
            toLocation: center,
            audio: module.getParamNode()!,
        });
    };

    return (
        <div className="switchDiv">

            {/* Channel input docks — absolutely positioned at top of module card */}
            {CHANNEL_LABELS.slice(0, count).map((label, i) => {
                // Distribute in [10%, 60%] to leave right side clear for the bypass button
                const leftPct = 10 + (i / Math.max(count - 1, 1)) * 50;
                return (
                    <div
                        key={i}
                        className="cordOuter show switch__ch-top-dock"
                        role="button"
                        tabIndex={0}
                        aria-label={`Channel ${label} input`}
                        style={{ position: 'absolute', top: '-1vh', left: `${leftPct}%` }}
                        onClick={(e) => onChannelOutput(e, i)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onChannelOutput(e, i);
                            }
                        }}
                    >
                        <div className="cordInner" id={parent + '|ch' + i + 'inputInner'} />
                        <span className="switch__dock-label" aria-hidden="true">{label}</span>
                    </div>
                );
            })}

            {/* CV input dock — top-right, green like #firstParam */}
            <div
                className="cordOuter show switch__cv-top-dock"
                role="button"
                tabIndex={0}
                aria-label="CV channel select input"
                style={{ position: 'absolute', top: '-1vh', left: '70%' }}
                onClick={onCVOutput}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onCVOutput(e);
                    }
                }}
            >
                <div className="cordInner" id={makeParamKey(parent) + ' inputInner'} />
                <span className="switch__dock-label" aria-hidden="true">CV</span>
            </div>

            {/* Channel count selector */}
            <div className="switch__header">
                <span className="switch__header-label">Inputs</span>
                <div className="switch__count">
                    <Selector
                        id={parent + '-switchCount'}
                        values={['2', '3', '4']}
                        initialValue={String(count)}
                        handleClick={(v) => setChannelCount(parseInt(v))}
                    />
                </div>
            </div>

            {/* Channel active selector rows */}
            <div className="switch__channels">
                {CHANNEL_LABELS.slice(0, count).map((label, i) => (
                    <div
                        key={i}
                        className={`switch__channel${active === i ? ' switch__channel--active' : ''}`}
                    >
                        <span className="switch__ch-label">{label}</span>
                        <button
                            className="switch__ch-select"
                            onClick={() => setActiveChannel(i)}
                            aria-label={`Select channel ${label}`}
                            aria-pressed={active === i}
                            title={active === i ? `Channel ${label} active` : `Switch to channel ${label}`}
                        >
                            {active === i ? '●' : '○'}
                        </button>
                    </div>
                ))}
            </div>

            {/* Auto-rate row */}
            <div className="switch__rate">
                <span className="switch__rate-label">Rate</span>
                <input
                    type="range"
                    min={0}
                    max={20}
                    step={0.1}
                    value={rate}
                    aria-label="Auto-cycle rate"
                    onChange={(e) => setRate(parseFloat(e.target.value))}
                />
                <span className="switch__rate-val">
                    {rate > 0 ? rate.toFixed(1) + ' Hz' : 'off'}
                </span>
            </div>
        </div>
    );
}

export default Switch;
