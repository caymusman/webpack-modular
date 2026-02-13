import { useRef, useEffect, useCallback } from 'react';
import Selector from '../ui/Selector';
import { setConvolverBuffer } from '../../audio/nodeHelpers';
import { createConvolverNode } from '../../audio/nodeFactories';
import { useAudioContext } from '../../audio/AudioContextProvider';

const shortWav = '/media/short.wav';
const mediumWav = '/media/medium.wav';
const longWav = '/media/long.wav';

interface ReverbProps {
    createAudio: (node: AudioNode) => void;
}

function Reverb({ createAudio }: ReverbProps) {
    const audioContext = useAudioContext();
    const audio = useRef(createConvolverNode(audioContext));

    const updateBuffer = useCallback(
        (path: string) => {
            fetch(path)
                .then((res) => res.arrayBuffer())
                .then((buffer) => audioContext.decodeAudioData(buffer))
                .then((final) => setConvolverBuffer(audio.current, final))
                .catch((err) => console.warn('Reverb: failed to load impulse response', path, err));
        },
        [audioContext]
    );

    useEffect(() => {
        updateBuffer(shortWav);
        createAudio(audio.current);
    }, [createAudio, updateBuffer]);

    const handleSelector = (value: string) => {
        switch (value) {
            case 'Small':
                updateBuffer(shortWav);
                break;
            case 'Medium':
                updateBuffer(mediumWav);
                break;
            case 'Large':
                updateBuffer(longWav);
                break;
        }
    };

    return (
        <div id="reverbDiv">
            <Selector id="reverbSelector" values={['Small', 'Medium', 'Large']} handleClick={handleSelector} />
        </div>
    );
}

export default Reverb;
