import App from '../App';
import { renderWithAudioContext } from './testUtils';

test('App renders without crashing', () => {
    const { container } = renderWithAudioContext(<App />);
    expect(container.querySelector('#mainDiv')).toBeTruthy();
});
