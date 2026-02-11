import { useState } from 'react';

function MyButton({ name, handleClick, inputOnly, audioIn }) {
    const [count, setCount] = useState(0);

    const onClick = () => {
        if (audioIn) {
            return;
        }
        handleClick(name + ' ' + count, name, inputOnly);
        setCount((c) => c + 1);
    };

    return (
        <button className="addBtn" onClick={onClick}>
            {name}
        </button>
    );
}

export default MyButton;
