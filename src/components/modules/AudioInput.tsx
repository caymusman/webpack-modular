import { useRef, useEffect } from 'react';
import Slider from '../ui/Slider';
import { useAudioContext } from '../../audio/AudioContextProvider';
import { useParam } from '../../hooks/useParam';
import type { AudioInputModule } from '../../model/modules/AudioInputModule';

interface AudioInputProps {
    module: AudioInputModule;
    alert: (msg: string) => void;
    handleClose: () => void;
}

function AudioInput({ module, alert, handleClose }: AudioInputProps) {
    const audioContext = useAudioContext();
    const mediaStream = useRef<MediaStream | null>(null);
    const [, setGain] = useParam(module.params.gain);

    useEffect(() => {
        const gainNode = module.getNode() as GainNode;
        if (navigator.mediaDevices) {
            navigator.mediaDevices
                .getUserMedia({ audio: true })
                .then((stream) => {
                    mediaStream.current = stream;
                    const audio = audioContext.createMediaStreamSource(stream);
                    audio.connect(gainNode);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioContext, handleClose, alert]);

    return <Slider labelName="audioInGain" tooltipText="Gain" min={0} max={1} step={0.01} setAudio={setGain} />;
}

export default AudioInput;
