import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioContext } from '../../audio/AudioContextProvider';
import { useParam } from '../../hooks/useParam';
import type { AudioClipModule } from '../../model/modules/AudioClipModule';

interface AudioClipProps {
    module: AudioClipModule;
    handleClose: () => void;
}

function AudioClip({ module, handleClose }: AudioClipProps) {
    const audioContext = useAudioContext();
    const [trimStart, setTrimStart] = useParam(module.params.trimStart);
    const [trimEnd, setTrimEnd] = useParam(module.params.trimEnd);
    const [rate, setRate] = useParam(module.params.playbackRate);
    const [loop, setLoop] = useParam(module.params.loop);
    const [bufferLoaded, setBufferLoaded] = useState(!!module.buffer);
    const [playing, setPlaying] = useState(false);
    const [dragging, setDragging] = useState<'start' | 'end' | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const playheadRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const draggingRef = useRef<'start' | 'end' | null>(null);
    const playStartRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);

    // Refs so RAF callback always has current values without re-creating
    const trimStartRef = useRef(trimStart);
    const trimEndRef = useRef(trimEnd);
    const loopRef = useRef(loop);
    trimStartRef.current = trimStart;
    trimEndRef.current = trimEnd;
    loopRef.current = loop;

    useEffect(() => {
        module.onBufferLoad = () => setBufferLoaded(true);
        return () => { module.onBufferLoad = null; };
    }, [module]);

    useEffect(() => {
        module.onPlaybackEnd = () => {
            setPlaying(false);
            playStartRef.current = null;
        };
        return () => { module.onPlaybackEnd = null; };
    }, [module]);

    // Draw waveform when buffer changes or trim points change
    useEffect(() => {
        if (!canvasRef.current || !module.buffer) return;
        const canvas = canvasRef.current;
        const ctx2d = canvas.getContext('2d');
        if (!ctx2d) return;
        const { width, height } = canvas;
        const data = module.buffer.getChannelData(0);
        const step = Math.ceil(data.length / width);

        ctx2d.fillStyle = '#1a1a2e';
        ctx2d.fillRect(0, 0, width, height);

        ctx2d.strokeStyle = '#4fc3f7';
        ctx2d.lineWidth = 1;
        ctx2d.beginPath();
        for (let x = 0; x < width; x++) {
            let min = 1, max = -1;
            for (let j = x * step; j < Math.min((x + 1) * step, data.length); j++) {
                if (data[j] < min) min = data[j];
                if (data[j] > max) max = data[j];
            }
            ctx2d.moveTo(x, (1 + min) * height / 2);
            ctx2d.lineTo(x, (1 + max) * height / 2);
        }
        ctx2d.stroke();

        const dur = module.buffer.duration;
        const sx = (trimStart / dur) * width;
        const ex = (trimEnd / dur) * width;

        ctx2d.fillStyle = 'rgba(0,0,0,0.5)';
        ctx2d.fillRect(0, 0, sx, height);
        ctx2d.fillRect(ex, 0, width - ex, height);

        ctx2d.strokeStyle = '#ffffff';
        ctx2d.lineWidth = 2;
        ctx2d.beginPath();
        ctx2d.moveTo(sx, 0); ctx2d.lineTo(sx, height);
        ctx2d.moveTo(ex, 0); ctx2d.lineTo(ex, height);
        ctx2d.stroke();
    }, [bufferLoaded, trimStart, trimEnd, module.buffer]);

    // Playhead animation loop
    useEffect(() => {
        if (!playing || !module.buffer || playStartRef.current === null) {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (playheadRef.current) playheadRef.current.style.left = '-2px';
            return;
        }

        const tick = () => {
            if (!module.buffer || playStartRef.current === null || !playheadRef.current) return;
            const elapsed = audioContext.currentTime - playStartRef.current;
            const start = trimStartRef.current;
            const end = trimEndRef.current;
            const range = end - start;
            let pos: number;
            if (loopRef.current && range > 0) {
                pos = start + (elapsed % range);
            } else {
                pos = Math.min(start + elapsed, end);
            }
            const pct = (pos / module.buffer.duration) * 100;
            playheadRef.current.style.left = `${pct}%`;
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [playing, module.buffer, audioContext]);

    // Trim handle drag handlers
    useEffect(() => {
        if (!dragging) return;
        const handleMouseMove = (e: MouseEvent) => {
            if (!canvasRef.current || !module.buffer) return;
            const rect = canvasRef.current.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            const dur = module.buffer.duration;
            const newTime = (x / rect.width) * dur;
            if (draggingRef.current === 'start') {
                setTrimStart(Math.min(newTime, trimEnd - 0.001));
            } else if (draggingRef.current === 'end') {
                setTrimEnd(Math.max(newTime, trimStart + 0.001));
            }
        };
        const handleMouseUp = () => { draggingRef.current = null; setDragging(null); };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, trimStart, trimEnd, module.buffer, setTrimStart, setTrimEnd]);

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (!canvasRef.current || !module.buffer) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const dur = module.buffer.duration;
        const sx = (trimStart / dur) * rect.width;
        const ex = (trimEnd / dur) * rect.width;
        if (Math.abs(x - sx) < 10) { draggingRef.current = 'start'; setDragging('start'); }
        else if (Math.abs(x - ex) < 10) { draggingRef.current = 'end'; setDragging('end'); }
    };

    const loadFile = useCallback((file: File) => {
        file.arrayBuffer()
            .then((buf) => audioContext.decodeAudioData(buf))
            .then((audioBuf) => module.loadBuffer(audioBuf, file.name))
            .catch((err) => {
                console.warn('AudioClip: failed to decode', err);
                handleClose();
            });
    }, [audioContext, module, handleClose]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) loadFile(file);
        e.target.value = '';
    };

    const openFilePicker = useCallback(async () => {
        if ('showOpenFilePicker' in window) {
            try {
                const [handle] = await (window as Window & { showOpenFilePicker: (opts: object) => Promise<FileSystemFileHandle[]> }).showOpenFilePicker({
                    types: [{ description: 'Audio', accept: { 'audio/*': ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a'] } }],
                    startIn: 'music',
                    multiple: false,
                });
                const file = await handle.getFile();
                loadFile(file);
            } catch {
                // user cancelled — no-op
            }
        } else {
            fileInputRef.current?.click();
        }
    }, [loadFile]);

    const handlePlay = () => {
        module.play();
        playStartRef.current = audioContext.currentTime;
        setPlaying(true);
    };

    const handleStop = () => {
        module.stop();
        playStartRef.current = null;
        setPlaying(false);
    };

    const handleClear = () => {
        module.clear();
        setBufferLoaded(false);
        setPlaying(false);
        playStartRef.current = null;
    };

    return (
        <div className="audioClipDiv">
            <div className="audioClip__name">
                {module.clipName || 'No file loaded'}
            </div>

            {bufferLoaded ? (
                <>
                    <div className="audioClip__waveWrap">
                        <canvas
                            ref={canvasRef}
                            className="audioClip__wave"
                            width={280}
                            height={80}
                            onMouseDown={handleCanvasMouseDown}
                        />
                        <div ref={playheadRef} className="audioClip__playhead" />
                    </div>
                    <div className="audioClip__trim">
                        <span>Start</span>
                        <input
                            type="number"
                            value={trimStart.toFixed(2)}
                            step={0.01}
                            min={0}
                            max={trimEnd}
                            aria-label="Trim start"
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) setTrimStart(Math.min(val, trimEnd - 0.001));
                            }}
                        />
                        <span>End</span>
                        <input
                            type="number"
                            value={trimEnd.toFixed(2)}
                            step={0.01}
                            min={trimStart}
                            aria-label="Trim end"
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) setTrimEnd(Math.max(val, trimStart + 0.001));
                            }}
                        />
                    </div>
                </>
            ) : (
                <div
                    className="audioClip__placeholder"
                    role="button"
                    tabIndex={0}
                    aria-label={module.clipName ? `Re-link ${module.clipName}` : 'Load audio file'}
                    onClick={openFilePicker}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFilePicker(); }
                    }}
                >
                    {module.clipName
                        ? <><i className="fa fa-exclamation-triangle" aria-hidden="true" /> {module.clipName} not found — click to re-link</>
                        : 'Click or drag a file to load'}
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                aria-label="Audio file"
            />

            <div className="audioClip__controls">
                <div className="audioClip__controls-row">
                    <button
                        className="audioClip__playBtn"
                        onClick={playing ? handleStop : handlePlay}
                        aria-label={playing ? 'Stop' : 'Play'}
                        disabled={!bufferLoaded}
                    >
                        {playing ? '⏹' : '▶'}
                    </button>
                    <label className="audioClip__loopLabel">
                        <input
                            type="checkbox"
                            checked={loop}
                            onChange={(e) => setLoop(e.target.checked)}
                            aria-label="Loop"
                        />
                        Loop
                    </label>
                    <div className="audioClip__btn-group">
                        <button
                            className="audioClip__loadBtn"
                            onClick={openFilePicker}
                            aria-label="Load audio file"
                            title="Load audio file"
                        >
                            <i className="fa fa-folder-open" aria-hidden="true" />
                        </button>
                        {bufferLoaded && (
                            <button
                                className="audioClip__clearBtn"
                                onClick={handleClear}
                                aria-label="Clear clip"
                                title="Clear clip"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>
                <div className="audioClip__rate">
                    <span>Rate</span>
                    <input
                        type="range"
                        min={0.1}
                        max={4}
                        step={0.01}
                        value={rate}
                        aria-label="Playback rate"
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setRate(val);
                            module.updatePlaybackRate(val);
                        }}
                    />
                    <span className="audioClip__rateVal">{rate.toFixed(2)}×</span>
                </div>
            </div>
        </div>
    );
}

export default AudioClip;
