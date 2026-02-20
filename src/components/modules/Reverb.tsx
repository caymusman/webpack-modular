import { useEffect, useCallback } from 'react';
import Selector from '../ui/Selector';
import { setConvolverBuffer } from '../../audio/nodeHelpers';
import { useAudioContext } from '../../audio/AudioContextProvider';
import { useParam } from '../../hooks/useParam';
import type { ReverbModule } from '../../model/modules/ReverbModule';

const base = import.meta.env.BASE_URL;
const shortWav = `${base}media/short.wav`;
const mediumWav = `${base}media/medium.wav`;
const longWav = `${base}media/long.wav`;

interface ReverbProps {
    module: ReverbModule;
}

function Reverb({ module }: ReverbProps) {
    const audioContext = useAudioContext();
    const [, setImpulse] = useParam(module.params.impulse);

    const updateBuffer = useCallback(
        (path: string) => {
            fetch(path)
                .then((res) => res.arrayBuffer())
                .then((buffer) => audioContext.decodeAudioData(buffer))
                .then((final) => setConvolverBuffer(module.getNode() as ConvolverNode, final))
                .catch((err) => console.warn('Reverb: failed to load impulse response', path, err));
        },
        [audioContext, module]
    );

    useEffect(() => {
        const impulseMap: Record<string, string> = { Small: shortWav, Medium: mediumWav, Large: longWav };
        updateBuffer(impulseMap[module.params.impulse.value as string] ?? shortWav);
    }, [updateBuffer, module]);

    const handleSelector = (value: string) => {
        setImpulse(value as typeof module.params.impulse.value);
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
