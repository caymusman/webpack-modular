import { useState } from 'react';
import { makeModuleId } from '../../utils/moduleId';

interface MyButtonProps {
    name: string;
    handleClick: (id: string, type: string, inputOnly: boolean) => void;
    inputOnly: boolean;
    audioIn?: boolean;
}

function MyButton({ name, handleClick, inputOnly, audioIn }: MyButtonProps) {
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
