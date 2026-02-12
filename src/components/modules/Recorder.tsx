import { useRef, useState, useEffect } from 'react';
import { createGainNode, createMediaStreamDestination } from '../../audio/nodeFactories';
import { useAudioContext } from '../../audio/AudioContextProvider';

interface RecorderProps {
    createAudio: (node: AudioNode) => void;
}

function Recorder({ createAudio }: RecorderProps) {
    const audioContext = useAudioContext();
    const audio = useRef(createGainNode(audioContext, 0));
    const destination = useRef(createMediaStreamDestination(audioContext));
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const chunks = useRef<Blob[]>([]);
    const [playing, setPlaying] = useState(false);
    const [finished, setFinished] = useState(false);
    const [href, setHref] = useState<string | null>(null);

    useEffect(() => {
        audio.current.connect(destination.current);
        const mr = new MediaRecorder(destination.current.stream, { mimeType: 'audio/ogg' });
        (mr as MediaRecorder & { audioChannels: number }).audioChannels = 2;
        chunks.current = [];
        mr.ondataavailable = (event) => {
            chunks.current.push(event.data);
        };
        mediaRecorder.current = mr;
        createAudio(audio.current);
    }, [audioContext, createAudio]);

    const handlePlay = () => {
        if (playing) {
            audio.current.gain.setTargetAtTime(0, audioContext.currentTime + 0.02, 0.02);
            setTimeout(() => {
                mediaRecorder.current!.stop();
                setPlaying(false);
            }, 100);
        } else {
            audio.current.gain.setTargetAtTime(1, audioContext.currentTime + 0.04, 0.04);
            mediaRecorder.current!.start();
            setPlaying(true);
            setFinished(false);
        }
    };

    const handleFinish = () => {
        audio.current.gain.setTargetAtTime(0, audioContext.currentTime + 0.02, 0.02);
        setTimeout(() => {
            mediaRecorder.current!.stop();
        }, 100);
        if (!finished) {
            setTimeout(() => {
                const blob = new Blob(chunks.current, { type: 'audio/ogg' });
                setHref(URL.createObjectURL(blob));
                setPlaying(false);
                setFinished(true);
            }, 510);
        }
    };

    return (
        <div id="RecorderDiv">
            <div id="recorderButtons">
                <button id="recorderPlay" onClick={handlePlay}>
                    {playing ? 'Pause' : 'Record'}
                </button>
                <button id="recorderFinish" onClick={handleFinish}>
                    Finish
                </button>
            </div>
            <a href={href ?? undefined} download="recordedAudio.ogg">
                {' '}
                Download Here
            </a>
        </div>
    );
}

export default Recorder;
