import { KeyboardEvent, memo } from 'react';

const CORD_COLORS = [
    '#ff6b9d', // pink
    '#c678dd', // purple
    '#61afef', // blue
    '#56b6c2', // cyan
    '#98c379', // green
    '#e5c07b', // yellow
    '#e06c75', // coral
    '#d19a66', // orange
];

export function cordColor(id: string): string {
    const n = parseInt(id.replace(/\D/g, ''), 10) || 0;
    return CORD_COLORS[n % CORD_COLORS.length];
}

interface CordProps {
    deleteCord: (id: string) => void;
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    fromName: string;
    toName: string;
    highlighted?: boolean;
    color: string;
}

// Build a drooping cable path. The midpoint control point is pulled straight
// down by `droop` pixels so the curve sags like a physical cable regardless
// of whether the cord runs horizontally, vertically, or diagonally.
export function cablePath(x1: number, y1: number, x2: number, y2: number): string {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const droop = Math.max(60, dist * 0.5);
    const cpx = (x1 + x2) / 2;
    const cpy = (y1 + y2) / 2 + droop;
    return `M ${x1},${y1} Q ${cpx},${cpy} ${x2},${y2}`;
}

function Cord({ deleteCord, id, x1, y1, x2, y2, fromName, toName, highlighted, color }: CordProps) {
    const handleClick = () => {
        deleteCord(id);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            handleClick();
        }
    };

    return (
        <g>
            <path
                d={cablePath(x1, y1, x2, y2)}
                fill="none"
                className={highlighted ? 'cord--insert-target' : undefined}
                onClick={handleClick}
                role="button"
                aria-label={'Delete cord from ' + fromName + ' to ' + toName}
                tabIndex={0}
                onKeyDown={handleKeyDown}
            />
            <circle cx={x1} cy={y1} r={5} fill={color} pointerEvents="none" />
            <circle cx={x1} cy={y1} r={2} fill="rgba(0,0,0,0.5)" pointerEvents="none" />
            <circle cx={x2} cy={y2} r={5} fill={color} pointerEvents="none" />
            <circle cx={x2} cy={y2} r={2} fill="rgba(0,0,0,0.5)" pointerEvents="none" />
        </g>
    );
}

export default memo(Cord);
