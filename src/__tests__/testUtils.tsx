import { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { AudioContextProvider } from '../audio/AudioContextProvider';
import { MIDIProvider } from '../midi/MIDIProvider';
import { MIDILearnProvider } from '../midi/MIDILearnContext';

export function renderWithAudioContext(ui: ReactElement) {
    return render(
        <AudioContextProvider>
            <MIDIProvider>
                <MIDILearnProvider>{ui}</MIDILearnProvider>
            </MIDIProvider>
        </AudioContextProvider>
    );
}
