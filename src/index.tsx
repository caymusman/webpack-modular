import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { AudioContextProvider } from './audio/AudioContextProvider';
import './App.scss';

const root = createRoot(document.getElementById('app')!);
root.render(
    <ErrorBoundary>
        <AudioContextProvider>
            <App />
        </AudioContextProvider>
    </ErrorBoundary>
);
