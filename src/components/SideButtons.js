import MyButton from './ui/MyButton';

function SideButtons({ id, handleClick, audioIn }) {
    return (
        <div id={id}>
            <MyButton name="Oscillator" handleClick={handleClick} inputOnly="true" />
            <MyButton name="Gain" handleClick={handleClick} inputOnly="false" />
            <MyButton name="Filter" handleClick={handleClick} inputOnly="false" />
            <MyButton name="Panner" handleClick={handleClick} inputOnly="false" />
            <MyButton name="ADSR" handleClick={handleClick} inputOnly="false" />
            <MyButton name="Delay" handleClick={handleClick} inputOnly="false" />
            <MyButton name="Distortion" handleClick={handleClick} inputOnly="false" />
            <MyButton name="Reverb" handleClick={handleClick} inputOnly="false" />
            <MyButton name="AudioInput" handleClick={handleClick} inputOnly="true" audioIn={audioIn} />
            <MyButton name="Recorder" handleClick={handleClick} inputOnly="false" />
        </div>
    );
}

export default SideButtons;
