import { useRef, useEffect, useCallback } from 'react';
import Selector from '../ui/Selector';
import { setConvolverBuffer } from '../../audio/nodeHelpers';
import { createConvolverNode } from '../../audio/nodeFactories';
import { useAudioContext } from '../../audio/AudioContextProvider';

function Reverb({ createAudio }) {
    const audioContext = useAudioContext();
    const audio = useRef(createConvolverNode(audioContext));

    const updateBuffer = useCallback(
        (path) => {
            fetch(path)
                .then((res) => res.arrayBuffer())
                .then((buffer) => audioContext.decodeAudioData(buffer))
                .then((final) => setConvolverBuffer(audio.current, final));
        },
        [audioContext]
    );

    useEffect(() => {
        updateBuffer('media/short.wav');
        createAudio(audio.current);
    }, [createAudio, updateBuffer]);

    const handleSelector = (value) => {
        switch (value) {
            case 'Small':
                updateBuffer('media/short.wav');
                break;
            case 'Medium':
                updateBuffer('media/medium.wav');
                break;
            case 'Large':
                updateBuffer('media/long.wav');
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
