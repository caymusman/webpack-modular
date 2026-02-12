import { useRef, useEffect } from 'react';
import Slider from '../ui/Slider';
import { createGainNode } from '../../audio/nodeFactories';
import { useAudioContext } from '../../audio/AudioContextProvider';

interface AudioInputProps {
    alert: (msg: string) => void;
    handleClose: () => void;
    createAudio: (node: AudioNode) => void;
}

function AudioInput({ alert, handleClose, createAudio }: AudioInputProps) {
    const audioContext = useAudioContext();
    const outputGain = useRef(createGainNode(audioContext, 0.5));
    const mediaStream = useRef<MediaStream | null>(null);

    useEffect(() => {
        const gainNode = outputGain.current;
        if (navigator.mediaDevices) {
            navigator.mediaDevices
                .getUserMedia({ audio: true })
                .then((stream) => {
                    mediaStream.current = stream;
                    const audio = audioContext.createMediaStreamSource(stream);
                    audio.connect(gainNode);
                    createAudio(gainNode);
                })
                .catch((err) => {
                    console.warn('When setting up media devices, I caught: \n' + err);
                    handleClose();
                    alert('You denied audio permissions. Allow permissions to create this module.');
                });
        } else {
            console.warn('Media Devices are not supported!');
            handleClose();
            alert('Media Devices are not supported.');
        }

        return () => {
            if (mediaStream.current) {
                mediaStream.current.getTracks().forEach((track) => track.stop());
            }
            gainNode.disconnect();
        };
    }, [audioContext, createAudio, handleClose, alert]);

    const setGain = (val: number) => {
        outputGain.current.gain.setValueAtTime(val, audioContext.currentTime);
    };

    return (
        <Slider labelName="audioInGain" tooltipText="Gain" min={0} max={1} step={0.01} setAudio={setGain} />
    );
}

export default AudioInput;
