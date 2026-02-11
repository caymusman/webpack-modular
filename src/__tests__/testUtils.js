import { render } from '@testing-library/react';
import { AudioContextProvider } from '../audio/AudioContextProvider';

export function renderWithAudioContext(ui) {
    return render(<AudioContextProvider>{ui}</AudioContextProvider>);
}
