import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useParam } from '../../hooks/useParam';
import type { OutputModule } from '../../model/modules/OutputModule';

interface OutputViewProps {
    module: OutputModule;
}

const PEAK_HOLD_MS = 1500;

export default function OutputView({ module }: OutputViewProps) {
    const [volume, setVolume] = useParam(module.params.volume);
    const [vuLevel, setVuLevel] = useState(0);
    const [peakLevel, setPeakLevel] = useState(0);
    const rafRef = useRef<number | null>(null);
    const peakTimeRef = useRef<number>(0);
    const peakValueRef = useRef<number>(0);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setVolume(Math.min(1, Math.max(0, Number(e.target.value))));
    };

    useEffect(() => {
        let analyser: AnalyserNode;
        try {
            analyser = module.getAnalyser();
        } catch {
            return;
        }

        const bufferLength = analyser.fftSize;
        const dataArray = new Float32Array(bufferLength);

        const loop = (now: number) => {
            rafRef.current = requestAnimationFrame(loop);
            analyser.getFloatTimeDomainData(dataArray);

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i] * dataArray[i];
            }
            const rms = Math.sqrt(sum / bufferLength);
            const level = Math.min(1, rms);

            setVuLevel(level);

            if (level >= peakValueRef.current) {
                peakValueRef.current = level;
                peakTimeRef.current = now;
                setPeakLevel(level);
            } else if (now - peakTimeRef.current > PEAK_HOLD_MS) {
                // Decay peak
                peakValueRef.current = Math.max(0, peakValueRef.current - 0.005);
                setPeakLevel(peakValueRef.current);
            }
        };

        rafRef.current = requestAnimationFrame(loop);
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [module]);

    const vuPct = vuLevel * 100;
    const peakPct = peakLevel * 100;
    const vuColor = vuLevel >= 0.9 ? '#e53e3e' : vuLevel >= 0.75 ? '#d69e2e' : '#38a169';

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
            <div className="vuMeter" aria-label="VU meter">
                <div
                    className="vuMeter__bar"
                    style={{ width: `${vuPct}%`, background: vuColor }}
                />
                {peakLevel > 0.01 && (
                    <div
                        className="vuMeter__peak"
                        style={{ left: `${peakPct}%`, background: peakLevel >= 0.9 ? '#e53e3e' : '#888' }}
                    />
                )}
            </div>
        </div>
    );
}
