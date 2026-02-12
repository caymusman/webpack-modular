import { createRoot } from 'react-dom/client';
import App from './App';
import { AudioContextProvider } from './audio/AudioContextProvider';
import './App.scss';

const root = createRoot(document.getElementById('app')!);
root.render(
    <AudioContextProvider>
        <App />
    </AudioContextProvider>
);
