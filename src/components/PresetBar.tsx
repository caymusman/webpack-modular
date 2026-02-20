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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    return (
        <div className="presetBar">
            <input
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
            <button className="presetBar__btn" onClick={handleSave} aria-label="Save preset">
                Save
            </button>

            <div className="presetBar__dropdown" ref={dropdownRef}>
                <button
                    className="presetBar__btn presetBar__btn--dropdown"
                    onClick={() => setDropdownOpen((o) => !o)}
                    aria-label="Load preset"
                    aria-expanded={dropdownOpen}
                >
                    Presets
                    {savedPresets.length > 0 && (
                        <span className="presetBar__count">{savedPresets.length}</span>
                    )}
                    <i className="fa fa-chevron-down" aria-hidden="true" />
                </button>
                {dropdownOpen && (
                    <div className="presetBar__dropdownPanel">
                        {savedPresets.length === 0 ? (
                            <div className="presetBar__dropdownEmpty">No saved presets</div>
                        ) : (
                            savedPresets.map((name) => (
                                <div key={name} className="presetBar__dropdownItem">
                                    <span
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`Load ${name}`}
                                        onClick={() => handleLoadByName(name)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') handleLoadByName(name);
                                        }}
                                    >
                                        {name}
                                    </span>
                                    <button
                                        className="presetBar__dropdownDelete"
                                        onClick={() => handleDeleteByName(name)}
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

            <button className="presetBar__btn" onClick={handleExport} aria-label="Export preset">
                Export
            </button>
            <button className="presetBar__btn" onClick={handleImport} aria-label="Import preset">
                Import
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                aria-label="Import preset file"
            />
            <button className="presetBar__btn presetBar__btn--clear" onClick={onClear} aria-label="Clear all">
                Clear
            </button>
        </div>
    );
}

export default PresetBar;
