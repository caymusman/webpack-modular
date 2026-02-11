import { memo } from 'react';

function Cord({ deleteCord, id, x1, y1, x2, y2 }) {
    const handleClick = () => {
        deleteCord(id);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    };

    return <line x1={x1} y1={y1} x2={x2} y2={y2} onClick={handleClick} role="button" aria-label={'Delete patch cord ' + id} tabIndex={0} onKeyDown={handleKeyDown}></line>;
}

export default memo(Cord);
