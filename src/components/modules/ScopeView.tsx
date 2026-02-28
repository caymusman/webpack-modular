import { useEffect, useRef } from 'react';
import type { ScopeModule } from '../../model/modules/ScopeModule';

interface ScopeViewProps {
    module: ScopeModule;
}

export default function ScopeView({ module }: ScopeViewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let analyser: AnalyserNode;
        try {
            analyser = module.getAnalyser();
        } catch {
            return;
        }

        const dataArray = new Uint8Array(analyser.fftSize);

        const draw = () => {
            rafRef.current = requestAnimationFrame(draw);
            analyser.getByteTimeDomainData(dataArray);

            const w = canvas.width;
            const h = canvas.height;

            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, w, h);

            // Grid line at center
            ctx.strokeStyle = 'rgba(0,255,136,0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, h / 2);
            ctx.lineTo(w, h / 2);
            ctx.stroke();

            // Waveform
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#00ff88';
            ctx.beginPath();

            const step = w / dataArray.length;
            for (let i = 0; i < dataArray.length; i++) {
                const y = ((dataArray[i] / 255.0) * 2 - 1) * (h / 2 - 4) + h / 2;
                if (i === 0) ctx.moveTo(0, y);
                else ctx.lineTo(i * step, y);
            }
            ctx.stroke();
        };

        draw();
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [module]);

    return (
        <div className="scopeDiv">
            <canvas ref={canvasRef} width={210} height={80} aria-label="Oscilloscope" />
        </div>
    );
}
