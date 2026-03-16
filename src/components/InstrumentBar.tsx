import { useState, useRef, useCallback, useEffect } from 'react';
import { Instrument } from '../types';
import {
    listInstruments,
    loadInstrument,
    saveInstrument,
    deleteInstrument,
    exportInstrumentFile,
    importInstrumentFile,
} from '../utils/instruments';

interface InstrumentBarProps {
    onAdd: (instrument: Instrument) => void;
    refreshTrigger: number;
}

function InstrumentBar({ onAdd, refreshTrigger }: InstrumentBarProps) {
    const [instruments, setInstruments] = useState<string[]>(() => listInstruments());
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const itemRefs = useRef<(HTMLSpanElement | null)[]>([]);

    useEffect(() => {
        setInstruments(listInstruments());
    }, [refreshTrigger]);

    useEffect(() => {
        if (!dropdownOpen) return;
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [dropdownOpen]);

    useEffect(() => {
        if (!dropdownOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setActiveIndex(-1);
        }
    }, [dropdownOpen]);

    useEffect(() => {
        if (dropdownOpen && activeIndex >= 0) {
            itemRefs.current[activeIndex]?.focus();
        }
    }, [activeIndex, dropdownOpen]);

    const refreshList = useCallback(() => setInstruments(listInstruments()), []);

    const handleLoad = useCallback(
        (name: string) => {
            const inst = loadInstrument(name);
            if (inst) onAdd(inst);
            setDropdownOpen(false);
        },
        [onAdd]
    );

    const handleExport = useCallback((name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const inst = loadInstrument(name);
        if (inst) exportInstrumentFile(inst);
    }, []);

    const handleDelete = useCallback(
        (name: string) => {
            deleteInstrument(name);
            refreshList();
        },
        [refreshList]
    );

    const handleImport = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;
            importInstrumentFile(file).then((inst) => {
                if (inst) {
                    saveInstrument(inst);
                    refreshList();
                    onAdd(inst);
                }
            });
            e.target.value = '';
        },
        [onAdd, refreshList]
    );

    return (
        <div className="instrumentBar">
            <div className="instrumentBar__dropdown" ref={dropdownRef}>
                <button
                    ref={triggerRef}
                    className="instrumentBar__btn instrumentBar__btn--dropdown"
                    onClick={() => setDropdownOpen((o) => !o)}
                    onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setDropdownOpen(true);
                            setActiveIndex(0);
                        } else if (e.key === 'Escape') {
                            setDropdownOpen(false);
                        }
                    }}
                    aria-label="Instrument library"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="listbox"
                    title="Instrument library"
                >
                    <span className="instrumentBar__btnLabel">
                        Instruments
                        {instruments.length > 0 && (
                            <span className="instrumentBar__count">{instruments.length}</span>
                        )}
                        <i className="fa fa-chevron-down" aria-hidden="true" />
                    </span>
                </button>
                {dropdownOpen && (
                    <div
                        className="instrumentBar__dropdownPanel"
                        role="listbox"
                        aria-label="Saved instruments"
                    >
                        {instruments.length === 0 ? (
                            <div className="instrumentBar__dropdownEmpty">No saved instruments</div>
                        ) : (
                            instruments.map((name, i) => (
                                <div key={name} className="instrumentBar__dropdownItem">
                                    <span
                                        ref={(el) => {
                                            itemRefs.current[i] = el;
                                        }}
                                        role="option"
                                        tabIndex={activeIndex === i ? 0 : -1}
                                        aria-selected={activeIndex === i}
                                        aria-label={`Add ${name} to patch`}
                                        onClick={() => handleLoad(name)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'ArrowDown') {
                                                e.preventDefault();
                                                setActiveIndex(Math.min(i + 1, instruments.length - 1));
                                            } else if (e.key === 'ArrowUp') {
                                                e.preventDefault();
                                                if (i === 0) {
                                                    setDropdownOpen(false);
                                                    triggerRef.current?.focus();
                                                } else {
                                                    setActiveIndex(i - 1);
                                                }
                                            } else if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                handleLoad(name);
                                            } else if (e.key === 'Escape') {
                                                setDropdownOpen(false);
                                                triggerRef.current?.focus();
                                            }
                                        }}
                                    >
                                        {name}
                                    </span>
                                    <button
                                        className="instrumentBar__dropdownIconBtn"
                                        onClick={(e) => handleExport(name, e)}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        aria-label={`Export ${name}`}
                                        title="Export instrument"
                                    >
                                        <i className="fa fa-download" aria-hidden="true" />
                                    </button>
                                    <button
                                        className="instrumentBar__dropdownDelete"
                                        onClick={() => handleDelete(name)}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        aria-label={`Delete ${name}`}
                                        title="Delete instrument"
                                    >
                                        <i className="fa fa-times" aria-hidden="true" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
            <button
                className="instrumentBar__btn"
                onClick={handleImport}
                aria-label="Import instrument from file"
                title="Import instrument from file"
            >
                Import
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                aria-label="Import instrument file"
            />
        </div>
    );
}

export default InstrumentBar;
