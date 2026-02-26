import { useEffect, useRef, useState } from 'react';
import { useParam } from '../../hooks/useParam';
import Slider from '../ui/Slider';
import { makeMIDILearnId } from '../../midi/midiUtils';
import type { EnvelopeFollowerModule } from '../../model/modules/EnvelopeFollowerModule';

interface EnvelopeFollowerViewProps {
    module: EnvelopeFollowerModule;
    parent: string;
}

export default function EnvelopeFollowerView({ module, parent }: EnvelopeFollowerViewProps) {
    const [attack, setAttack] = useParam(module.params.attack);
    const [release, setRelease] = useParam(module.params.release);
    const [level, setLevel] = useState(0);
    const rafRef = useRef<number | null>(null);
    const smoothedRef = useRef(0);

    useEffect(() => {
        let analyser: AnalyserNode;
        try {
            analyser = module.getAnalyser();
        } catch {
            return;
        }

        const buf = new Float32Array(analyser.fftSize);

        const loop = () => {
            rafRef.current = requestAnimationFrame(loop);
            analyser.getFloatTimeDomainData(buf);

            // RMS amplitude
            let sum = 0;
            for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
            const rms = Math.sqrt(sum / buf.length);

            // Attack / release smoothing (simple 1-pole)
            const attackMs = module.params.attack.value;
            const releaseMs = module.params.release.value;
            const dt = 1000 / 60; // ~60fps
            const coeff = rms > smoothedRef.current
                ? Math.exp(-dt / attackMs)
                : Math.exp(-dt / releaseMs);
            smoothedRef.current = coeff * smoothedRef.current + (1 - coeff) * rms;

            module.setEnvelope(smoothedRef.current);
            setLevel(smoothedRef.current);
        };

        rafRef.current = requestAnimationFrame(loop);
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [module]);

    const pct = Math.min(level * 400, 100); // scale 0–0.25 RMS → 0–100%

    return (
        <div className="envFollowerDiv">
            <div className="envFollowerDiv__meter">
                <div className="envFollowerDiv__bar" style={{ width: pct + '%' }} />
            </div>
            <div className="envFollowerDiv__cv">CV: {level.toFixed(3)}</div>
            <Slider
                labelName="envAttack"
                tooltipText="Attack (ms)"
                min={1}
                max={500}
                step={1}
                setAudio={setAttack}
                midiLearnId={makeMIDILearnId(parent, 'attack')}
                initialValue={attack}
            />
            <Slider
                labelName="envRelease"
                tooltipText="Release (ms)"
                min={10}
                max={2000}
                step={1}
                setAudio={setRelease}
                midiLearnId={makeMIDILearnId(parent, 'release')}
                initialValue={release}
            />
        </div>
    );
}
