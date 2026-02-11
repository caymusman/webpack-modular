import { useRef, useEffect } from 'react';
import Slider from '../ui/Slider';

function AudioInput({ alert, handleClose, audioContext, createAudio }) {
    const outputGain = useRef(audioContext.createGain());
    const mediaStream = useRef(null);

    useEffect(() => {
        const gainNode = outputGain.current;
        if (navigator.mediaDevices) {
            navigator.mediaDevices
                .getUserMedia({ audio: true })
                .then((stream) => {
                    mediaStream.current = stream;
                    const audio = audioContext.createMediaStreamSource(stream);
                    audio.connect(gainNode);
                    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
                    createAudio(gainNode);
                })
                .catch((err) => {
                    console.warn('When setting up media devices, I caught: \n' + err); // eslint-disable-line no-console
                    handleClose();
                    alert('You denied audio permissions. Allow permissions to create this module.');
                });
        } else {
            console.warn('Media Devices are not supported!'); // eslint-disable-line no-console
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

    const setGain = (val) => {
        outputGain.current.gain.setValueAtTime(val, audioContext.currentTime);
    };

    return (
        <Slider labelName="audioInGain" tooltipText="Gain" min={0} max={1} step={0.01} mid={0.5} setAudio={setGain} />
    );
}

export default AudioInput;
