import { KeyboardEvent, memo } from 'react';

interface CordProps {
    deleteCord: (id: string) => void;
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    fromName: string;
    toName: string;
}

function Cord({ deleteCord, id, x1, y1, x2, y2, fromName, toName }: CordProps) {
    const handleClick = () => {
        deleteCord(id);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    };

    return (
        <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            onClick={handleClick}
            role="button"
            aria-label={'Delete cord from ' + fromName + ' to ' + toName}
            tabIndex={0}
            onKeyDown={handleKeyDown}
        ></line>
    );
}

export default memo(Cord);
