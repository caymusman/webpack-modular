import { KeyboardEvent, useState, useRef, useEffect, useCallback } from 'react';

interface SelectorProps {
    id: string;
    values: string[];
    handleClick: (val: string) => void;
}

function Selector({ id, values, handleClick }: SelectorProps) {
    const [val, setVal] = useState(values[0]);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Focus the active item whenever the dropdown opens or active index changes
    useEffect(() => {
        if (isOpen && activeIndex >= 0) {
            itemRefs.current[activeIndex]?.focus();
        }
    }, [isOpen, activeIndex]);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    const close = useCallback(() => {
        setIsOpen(false);
        containerRef.current?.focus();
    }, []);

    const select = useCallback(
        (option: string) => {
            setVal(option);
            handleClick(option);
            close();
        },
        [handleClick, close]
    );

    const handleContainerKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                setIsOpen(true);
                setActiveIndex(0);
            }
        } else {
            if (e.key === 'Escape') {
                e.preventDefault();
                close();
            }
        }
    };

    const handleItemKeyDown = (e: KeyboardEvent<HTMLDivElement>, i: number) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(Math.min(i + 1, values.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (i === 0) close();
            else setActiveIndex(i - 1);
        } else if (e.key === 'Home') {
            e.preventDefault();
            setActiveIndex(0);
        } else if (e.key === 'End') {
            e.preventDefault();
            setActiveIndex(values.length - 1);
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            select(values[i]);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            close();
        }
    };

    return (
        <div
            id={id}
            ref={containerRef}
            className={`selectorDiv${isOpen ? ' selectorDiv--open' : ''}`}
            role="listbox"
            aria-label={id}
            aria-expanded={isOpen}
            tabIndex={0}
            onKeyDown={handleContainerKeyDown}
        >
            <span role="option" aria-selected="true">
                {val}
            </span>
            <div id="selectorContent">
                {values.map((el, i) => (
                    <div
                        key={el}
                        ref={(node) => {
                            itemRefs.current[i] = node;
                        }}
                        className="selectorVal"
                        role="option"
                        aria-selected={el === val}
                        tabIndex={isOpen && activeIndex === i ? 0 : -1}
                        onClick={() => select(el)}
                        onKeyDown={(e) => handleItemKeyDown(e, i)}
                    >
                        {el}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Selector;
