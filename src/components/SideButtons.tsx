import { memo } from 'react';

interface SideButtonsProps {
    id: string;
    onOpenPalette: () => void;
}

function SideButtons({ id, onOpenPalette }: SideButtonsProps) {
    return (
        <div id={id}>
            <button className="addBtn addBtn--open" onClick={onOpenPalette} aria-label="Add module (N)">
                <i className="fa fa-plus" aria-hidden="true"></i>
                <span className="addBtn__hint">N</span>
            </button>
        </div>
    );
}

export default memo(SideButtons);
