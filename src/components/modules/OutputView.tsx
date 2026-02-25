import { ChangeEvent } from 'react';
import { useParam } from '../../hooks/useParam';
import type { OutputModule } from '../../model/modules/OutputModule';

interface OutputViewProps {
    module: OutputModule;
}

export default function OutputView({ module }: OutputViewProps) {
    const [volume, setVolume] = useParam(module.params.volume);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setVolume(Math.min(1, Math.max(0, Number(e.target.value))));
    };

    return (
        <div className="outputViewDiv">
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume as number}
                onChange={handleChange}
                aria-label="Master volume"
            />
            <span className="outputViewDiv__pct">{Math.round((volume as number) * 100)}%</span>
        </div>
    );
}
