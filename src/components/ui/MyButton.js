import { useState } from 'react';
import { makeModuleId } from '../../utils/moduleId';

function MyButton({ name, handleClick, inputOnly, audioIn }) {
    const [count, setCount] = useState(0);

    const onClick = () => {
        if (audioIn) {
            return;
        }
        handleClick(makeModuleId(name, count), name, inputOnly);
        setCount((c) => c + 1);
    };

    return (
        <button className="addBtn" onClick={onClick} disabled={audioIn}>
            {name}
        </button>
    );
}

export default MyButton;
