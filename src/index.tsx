import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { AudioContextProvider } from './audio/AudioContextProvider';
import { MIDIProvider } from './midi/MIDIProvider';
import { MIDILearnProvider } from './midi/MIDILearnContext';
import './App.scss';

const root = createRoot(document.getElementById('app')!);
root.render(
    <ErrorBoundary>
        <AudioContextProvider>
            <MIDIProvider>
                <MIDILearnProvider>
                    <App />
                </MIDILearnProvider>
            </MIDIProvider>
        </AudioContextProvider>
    </ErrorBoundary>
);
