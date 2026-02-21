import { useState, useRef, useCallback, useEffect } from 'react';
import { serializePreset } from '../utils/presets';
import {
    saveToLocalStorage,
    loadFromLocalStorage,
    listPresets,
    deletePreset,
    exportPresetFile,
    importPresetFile,
} from '../utils/presets';
import { PatchCord, ModuleRecord, Preset } from '../types';

interface PresetBarProps {
    list: Map<string, ModuleRecord>;
    patchCords: PatchCord[];
    onLoad: (preset: Preset) => void;
    onClear: () => void;
}

function PresetBar({ list, patchCords, onLoad, onClear }: PresetBarProps) {
    const [presetName, setPresetName] = useState('');
    const [savedPresets, setSavedPresets] = useState<string[]>(() => listPresets());
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [confirmingClear, setConfirmingClear] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const confirmYesRef = useRef<HTMLButtonElement>(null);
    const itemRefs = useRef<(HTMLSpanElement | null)[]>([]);

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

    // Auto-focus the Yes button when the confirm dialog appears
    useEffect(() => {
        if (confirmingClear) {
            confirmYesRef.current?.focus();
        }
    }, [confirmingClear]);

    // Close confirm dialog on Escape
    useEffect(() => {
        if (!confirmingClear) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                setConfirmingClear(false);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [confirmingClear]);

    const refreshPresets = useCallback(() => {
        setSavedPresets(listPresets());
    }, []);

    const handleSave = useCallback(() => {
        const name = presetName.trim();
        if (!name) return;
        const preset = serializePreset(name, list, patchCords);
        saveToLocalStorage(preset);
        setPresetName('');
        refreshPresets();
    }, [presetName, list, patchCords, refreshPresets]);

    const handleLoadByName = useCallback(
        (name: string) => {
            const preset = loadFromLocalStorage(name);
            if (preset) {
                onLoad(preset);
            }
            setDropdownOpen(false);
        },
        [onLoad]
    );

    const handleDeleteByName = useCallback(
        (name: string) => {
            deletePreset(name);
            refreshPresets();
        },
        [refreshPresets]
    );

    const handleExport = useCallback(() => {
        const name = presetName.trim() || 'preset';
        const preset = serializePreset(name, list, patchCords);
        exportPresetFile(preset);
    }, [presetName, list, patchCords]);

    const handleImport = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;
            importPresetFile(file).then((preset) => {
                if (preset) {
                    onLoad(preset);
                }
            });
            event.target.value = '';
        },
        [onLoad]
    );

    const triggerClear = useCallback(() => {
        setConfirmingClear(true);
    }, []);

    const confirmClear = useCallback(() => {
        setConfirmingClear(false);
        onClear();
    }, [onClear]);

    // Global keyboard shortcuts: Ctrl/Cmd + key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (!e.ctrlKey && !e.metaKey) return;
            switch (e.key.toLowerCase()) {
                case 's':
                    e.preventDefault();
                    if (!presetName.trim()) nameInputRef.current?.focus();
                    else handleSave();
                    break;
                case 'l':
                    e.preventDefault();
                    setDropdownOpen((o) => !o);
                    setActiveIndex(0);
                    break;
                case 'e':
                    e.preventDefault();
                    handleExport();
                    break;
                case 'o':
                    e.preventDefault();
                    handleImport();
                    break;
                case 'backspace': {
                    const target = e.target as Element;
                    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') break;
                    e.preventDefault();
                    setConfirmingClear(true);
                    break;
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleSave, handleExport, handleImport, presetName]);

    return (
        <div className="presetBar">
            <input
                ref={nameInputRef}
                className="presetBar__name"
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                }}
                placeholder="preset name"
                aria-label="Preset name"
            />
            <button
                className="presetBar__btn"
                onClick={handleSave}
                aria-label="Save preset"
                title="Save preset (Ctrl+S)"
            >
                <span>Save</span>
                <span className="presetBar__shortcut" aria-hidden="true">⌃S</span>
            </button>

            <div className="presetBar__dropdown" ref={dropdownRef}>
                <button
                    ref={triggerRef}
                    className="presetBar__btn presetBar__btn--dropdown"
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
                    aria-label="Load preset"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="listbox"
                    title="Load preset (Ctrl+L)"
                >
                    <span className="presetBar__btnLabel">
                        Presets
                        {savedPresets.length > 0 && (
                            <span className="presetBar__count">{savedPresets.length}</span>
                        )}
                        <i className="fa fa-chevron-down" aria-hidden="true" />
                    </span>
                    <span className="presetBar__shortcut" aria-hidden="true">⌃L</span>
                </button>
                {dropdownOpen && (
                    <div className="presetBar__dropdownPanel" role="listbox" aria-label="Saved presets">
                        {savedPresets.length === 0 ? (
                            <div className="presetBar__dropdownEmpty">No saved presets</div>
                        ) : (
                            savedPresets.map((name, i) => (
                                <div key={name} className="presetBar__dropdownItem">
                                    <span
                                        ref={(el) => {
                                            itemRefs.current[i] = el;
                                        }}
                                        role="option"
                                        tabIndex={activeIndex === i ? 0 : -1}
                                        aria-selected={activeIndex === i}
                                        aria-label={`Load ${name}`}
                                        onClick={() => handleLoadByName(name)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'ArrowDown') {
                                                e.preventDefault();
                                                setActiveIndex(Math.min(i + 1, savedPresets.length - 1));
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
                                                handleLoadByName(name);
                                            } else if (e.key === 'Escape') {
                                                setDropdownOpen(false);
                                                triggerRef.current?.focus();
                                            }
                                        }}
                                    >
                                        {name}
                                    </span>
                                    <button
                                        className="presetBar__dropdownDelete"
                                        onClick={() => handleDeleteByName(name)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') {
                                                setDropdownOpen(false);
                                                triggerRef.current?.focus();
                                            }
                                        }}
                                        aria-label={`Delete ${name}`}
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
                className="presetBar__btn"
                onClick={handleExport}
                aria-label="Export preset"
                title="Export preset (Ctrl+E)"
            >
                <span>Export</span>
                <span className="presetBar__shortcut" aria-hidden="true">⌃E</span>
            </button>
            <button
                className="presetBar__btn"
                onClick={handleImport}
                aria-label="Import preset"
                title="Import preset (Ctrl+O)"
            >
                <span>Import</span>
                <span className="presetBar__shortcut" aria-hidden="true">⌃O</span>
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                aria-label="Import preset file"
            />

            {confirmingClear ? (
                <>
                    <span className="presetBar__clearConfirm">Clear everything?</span>
                    <button
                        ref={confirmYesRef}
                        className="presetBar__btn presetBar__btn--clear"
                        onClick={confirmClear}
                        aria-label="Confirm clear"
                    >
                        Yes
                    </button>
                    <button
                        className="presetBar__btn"
                        onClick={() => setConfirmingClear(false)}
                        aria-label="Cancel clear"
                    >
                        No
                    </button>
                </>
            ) : (
                <button
                    className="presetBar__btn presetBar__btn--clear"
                    onClick={triggerClear}
                    aria-label="Clear all"
                    title="Clear all (Ctrl+⌫)"
                >
                    <span>Clear</span>
                    <span className="presetBar__shortcut" aria-hidden="true">⌃⌫</span>
                </button>
            )}
        </div>
    );
}

export default PresetBar;
