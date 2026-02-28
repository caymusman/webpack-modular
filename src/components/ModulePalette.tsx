import { useState, useEffect, useRef, useCallback } from 'react';
import { MODULE_LIST, MODULE_GROUPS } from '../model/index';

interface ModulePaletteProps {
    onAdd: (type: string, inputOnly: boolean) => void;
    onClose: () => void;
    audioIn: boolean;
}

export default function ModulePalette({ onAdd, onClose, audioIn }: ModulePaletteProps) {
    const [query, setQuery] = useState('');
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const paletteRef = useRef<HTMLDivElement>(null);

    const isSearching = query.trim().length > 0;

    // Flat list when searching
    const searchResults = isSearching
        ? MODULE_LIST.filter((m) => m.label.toLowerCase().includes(query.toLowerCase()))
        : [];

    // Flat navigable items for grouped mode (skips collapsed groups)
    const groupedItems = isSearching
        ? []
        : MODULE_GROUPS.flatMap((g) =>
              collapsed.has(g.label)
                  ? []
                  : MODULE_LIST.filter((m) => g.types.includes(m.type))
          );

    const navigableItems = isSearching ? searchResults : groupedItems;

    useEffect(() => { inputRef.current?.focus(); }, []);

    useEffect(() => { setActiveIndex(0); }, [query]);

    useEffect(() => {
        const activeItem = document.getElementById(`palette-item-${navigableItems[activeIndex]?.type}`);
        activeItem?.scrollIntoView?.({ block: 'nearest' });
    }, [activeIndex, navigableItems]);

    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleMouseDown);
        return () => document.removeEventListener('mousedown', handleMouseDown);
    }, [onClose]);

    const toggleGroup = useCallback((label: string) => {
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(label)) next.delete(label);
            else next.add(label);
            return next;
        });
    }, []);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, navigableItems.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter') {
                const item = navigableItems[activeIndex];
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
        [navigableItems, activeIndex, audioIn, onAdd, onClose]
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

    // Build a nav-index map so each item knows its keyboard position
    const navIndexMap = new Map(navigableItems.map((m, i) => [m.type, i]));

    const renderItem = (m: (typeof MODULE_LIST)[number]) => {
        const disabled = m.type === 'AudioInput' && audioIn;
        const navIdx = navIndexMap.get(m.type) ?? -1;
        const isActive = navIdx === activeIndex;
        return (
            <li
                key={m.type}
                id={`palette-item-${m.type}`}
                className={`modulePalette__item${isActive ? ' modulePalette__item--active' : ''}${disabled ? ' modulePalette__item--disabled' : ''}`}
                role="option"
                aria-selected={isActive}
                aria-disabled={disabled}
                onClick={() => handleItemClick(m.type, m.inputOnly, disabled)}
            >
                {m.label}
            </li>
        );
    };

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
                aria-activedescendant={
                    navigableItems[activeIndex]
                        ? `palette-item-${navigableItems[activeIndex].type}`
                        : undefined
                }
            />
            <ul className="modulePalette__list" role="listbox">
                {isSearching ? (
                    <>
                        {searchResults.map((m) => renderItem(m))}
                        {searchResults.length === 0 && (
                            <li className="modulePalette__empty">No results</li>
                        )}
                    </>
                ) : (
                    MODULE_GROUPS.map((group) => {
                        const items = MODULE_LIST.filter((m) => group.types.includes(m.type));
                        const isCollapsed = collapsed.has(group.label);
                        return (
                            <li key={group.label} className="modulePalette__group" role="presentation">
                                <button
                                    className="modulePalette__groupHeader"
                                    onClick={() => toggleGroup(group.label)}
                                    aria-expanded={!isCollapsed}
                                >
                                    <span>{group.label}</span>
                                    <i
                                        className={`fa fa-chevron-${isCollapsed ? 'right' : 'down'}`}
                                        aria-hidden="true"
                                    />
                                </button>
                                {!isCollapsed && (
                                    <ul className="modulePalette__groupList" role="presentation">
                                        {items.map((m) => renderItem(m))}
                                    </ul>
                                )}
                            </li>
                        );
                    })
                )}
            </ul>
        </div>
    );
}
