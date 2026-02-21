import { useState, useEffect, useRef, useCallback } from 'react';
import { MODULE_LIST } from '../model/index';

interface ModulePaletteProps {
    onAdd: (type: string, inputOnly: boolean) => void;
    onClose: () => void;
    audioIn: boolean;
}

export default function ModulePalette({ onAdd, onClose, audioIn }: ModulePaletteProps) {
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const paletteRef = useRef<HTMLDivElement>(null);

    const filtered = MODULE_LIST.filter((m) => m.type.toLowerCase().includes(query.toLowerCase()));

    useEffect(() => {
        setActiveIndex(0);
    }, [query]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        const activeItem = document.getElementById(`palette-item-${filtered[activeIndex]?.type}`);
        activeItem?.scrollIntoView?.({ block: 'nearest' });
    }, [activeIndex, filtered]);

    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleMouseDown);
        return () => document.removeEventListener('mousedown', handleMouseDown);
    }, [onClose]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter') {
                const item = filtered[activeIndex];
                if (item) {
                    const disabled = item.type === 'AudioInput' && audioIn;
                    if (!disabled) {
                        onAdd(item.type, item.inputOnly);
                        onClose();
                    }
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        },
        [filtered, activeIndex, audioIn, onAdd, onClose]
    );

    const handleItemClick = useCallback(
        (type: string, inputOnly: boolean, disabled: boolean) => {
            if (!disabled) {
                onAdd(type, inputOnly);
                onClose();
            }
        },
        [onAdd, onClose]
    );

    return (
        <div
            className="modulePalette"
            ref={paletteRef}
            role="dialog"
            aria-label="Add module"
            aria-modal="true"
        >
            <input
                className="modulePalette__search"
                ref={inputRef}
                type="text"
                placeholder="Search modules..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="Search modules"
                aria-autocomplete="list"
                aria-activedescendant={filtered[activeIndex] ? `palette-item-${filtered[activeIndex].type}` : undefined}
            />
            <ul className="modulePalette__list" role="listbox">
                {filtered.map((m, i) => {
                    const disabled = m.type === 'AudioInput' && audioIn;
                    return (
                        <li
                            key={m.type}
                            id={`palette-item-${m.type}`}
                            className={`modulePalette__item${i === activeIndex ? ' modulePalette__item--active' : ''}${disabled ? ' modulePalette__item--disabled' : ''}`}
                            role="option"
                            aria-selected={i === activeIndex}
                            aria-disabled={disabled}
                            onClick={() => handleItemClick(m.type, m.inputOnly, disabled)}
                        >
                            {m.type}
                        </li>
                    );
                })}
                {filtered.length === 0 && <li className="modulePalette__empty">No results</li>}
            </ul>
        </div>
    );
}
