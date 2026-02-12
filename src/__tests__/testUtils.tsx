import { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { AudioContextProvider } from '../audio/AudioContextProvider';

export function renderWithAudioContext(ui: ReactElement) {
    return render(<AudioContextProvider>{ui}</AudioContextProvider>);
}
