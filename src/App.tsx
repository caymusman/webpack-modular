import { useState, useCallback, useEffect, useRef, createRef, ReactElement } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import AlertBox from './components/AlertBox';
import Area from './components/Area';
import Cord from './components/Cord';
import Output from './components/Output';
import ModulePalette from './components/ModulePalette';
import PresetBar from './components/PresetBar';
import { getModuleType, getBaseModuleId, makeModuleId } from './utils/moduleId';
import { getCenterPoint } from './utils/centerPoint';
import { createModule } from './model/index';
import { useAudioContext } from './audio/AudioContextProvider';
import { useMIDILearn } from './midi/MIDILearnContext';
import { useMIDIPlayback } from './midi/useMIDIPlayback';
import { PatchCord, CordFromData, CordToData, ModuleRecord, CordCombos, Preset, SerializedConnection } from './types';

export default function App() {
    const audioContext = useAudioContext();
    const { learnMode, toggleLearnMode, loadMappings, serializeMappings } = useMIDILearn();
    const [list, setList] = useState<Map<string, ModuleRecord>>(new Map());
    useMIDIPlayback(list);
    const [patchCords, setPatchCords] = useState<PatchCord[]>([]);
    const [cumulativeCordCount, setCumulativeCordCount] = useState(0);
    const [outputMode, setOutputMode] = useState(false);
    const [cordCombos, setCordCombos] = useState<CordCombos>({});
    const [pingText, setPingText] = useState('');
    const [audioIn, setAudioIn] = useState(false);
    const [patchSource, setPatchSource] = useState<string | null>(null);
    const [nodeRefs] = useState(() => new Map<string, React.RefObject<HTMLDivElement>>());
    const [moduleCounts, setModuleCounts] = useState<Record<string, number>>({});
    const [pendingConnections, setPendingConnections] = useState<SerializedConnection[] | null>(null);
    const [paletteOpen, setPaletteOpen] = useState(false);

    const pendingCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingFocusRef = useRef<string | null>(null);

    const getNodeRef = useCallback(
        (key: string) => {
            if (!nodeRefs.has(key)) {
                nodeRefs.set(key, createRef<HTMLDivElement>());
            }
            return nodeRefs.get(key)!;
        },
        [nodeRefs]
    );

    const handlePatchExit = useCallback(() => {
        setPatchCords((prev) => prev.slice(0, -1));
        setCumulativeCordCount((c) => c - 1);
        setPatchSource(null);
        setOutputMode(false);
    }, []);

    const myAlert = useCallback((ping: string) => {
        setPingText(ping);
    }, []);

    const handlePingExit = useCallback(() => {
        setPingText('');
    }, []);

    const handleClick = useCallback(
        (type: string, inputOnly: boolean) => {
            if (outputMode) {
                handlePatchExit();
            }
            const count = moduleCounts[type] || 0;
            const childKey = makeModuleId(type, count);
            setModuleCounts((prev) => ({ ...prev, [type]: count + 1 }));

            if (type === 'AudioInput') {
                setAudioIn(true);
            }

            const mod = createModule(type);
            mod.init(audioContext);

            pendingFocusRef.current = childKey;
            setCordCombos((prev) => ({ ...prev, [childKey]: [] }));
            setList((prev) => {
                const newMap = new Map(prev);
                newMap.set(childKey, {
                    myKey: childKey,
                    filling: type,
                    name: type,
                    inputOnly: inputOnly,
                    position: { x: 0, y: 0 },
                    module: mod,
                });
                return newMap;
            });
        },
        [outputMode, handlePatchExit, moduleCounts, audioContext]
    );

    const handleClose = useCallback(
        (childKey: string) => {
            const record = list.get(childKey);
            if (record) {
                record.module.dispose();
            }
            nodeRefs.delete(childKey);

            setList((prev) => {
                const newMap = new Map(prev);
                newMap.delete(childKey);
                return newMap;
            });

            if (getModuleType(childKey) === 'AudioInput') {
                setAudioIn(false);
            }

            setPatchCords((prevCords) => {
                const toRemove: PatchCord[] = [];
                prevCords.forEach((el) => {
                    if (el.fromData.fromModID === childKey) {
                        toRemove.push(el);
                        el.fromData.audio.disconnect(el.toData!.audio as AudioNode);
                    }
                    if (el.toData!.tomyKey === childKey || getBaseModuleId(el.toData!.tomyKey) === childKey) {
                        toRemove.push(el);
                        el.fromData.audio.disconnect(el.toData!.audio as AudioNode);
                    }
                });
                return prevCords.filter((el) => !toRemove.includes(el));
            });

            setCordCombos((prev) => {
                const newCombos = { ...prev };
                Object.keys(newCombos).forEach((key) => {
                    if (Array.isArray(newCombos[key])) {
                        newCombos[key] = newCombos[key].filter((v) => v !== childKey);
                    }
                });
                delete newCombos[childKey];
                return newCombos;
            });
        },
        [nodeRefs, list]
    );

    const addCord = useCallback(
        (info: CordFromData) => {
            setPatchCords((prev) => [...prev, { id: 'cord' + cumulativeCordCount, fromData: info, toData: null }]);
            setCumulativeCordCount((c) => c + 1);
            setPatchSource(info.fromModID);
            setOutputMode(true);
        },
        [cumulativeCordCount]
    );

    const handleOutput = useCallback(
        (info: CordToData) => {
            if (outputMode) {
                setPatchCords((prevCords) => {
                    const newCords = [...prevCords];
                    const lastEl = newCords[prevCords.length - 1];
                    if (!lastEl) return prevCords;
                    const fromMod = lastEl.fromData.fromModID;

                    if (fromMod === info.tomyKey) {
                        myAlert('You cannot plug a module into itself!');
                        return prevCords.slice(0, -1);
                    } else if (cordCombos[fromMod] && cordCombos[fromMod].includes(info.tomyKey)) {
                        myAlert("You've already patched this cable!");
                        return prevCords.slice(0, -1);
                    } else if (info.tomyKey.includes(fromMod)) {
                        myAlert('Hahaha thats a new one. Nice try.');
                        return prevCords.slice(0, -1);
                    } else {
                        lastEl.toData = info;
                        lastEl.fromData.audio.connect(info.audio as AudioNode);
                        setCordCombos((prev) => {
                            const newCombo = { ...prev };
                            if (newCombo[fromMod]) {
                                newCombo[fromMod] = [...newCombo[fromMod], info.tomyKey];
                            }
                            return newCombo;
                        });
                        return newCords;
                    }
                });
                setPatchSource(null);
                setOutputMode(false);
            }
        },
        [outputMode, cordCombos, myAlert]
    );

    const deleteCord = useCallback((cordID: string) => {
        setPatchCords((prevCords) => {
            const cord = prevCords.find((el) => el.id === cordID);
            if (cord) {
                cord.fromData.audio.disconnect(cord.toData!.audio as AudioNode);
                const fromCombo = cord.fromData.fromModID;
                setCordCombos((prev) => {
                    const newCombo = { ...prev };
                    if (newCombo[fromCombo]) {
                        newCombo[fromCombo] = newCombo[fromCombo].filter((v) => v !== cord.toData!.tomyKey);
                    }
                    return newCombo;
                });
            }
            return prevCords.filter((el) => el.id !== cordID);
        });
    }, []);

    const handleDrag = useCallback(
        (modID: string, _e: DraggableEvent, data: DraggableData) => {
            setList((prev) => {
                const newMap = new Map(prev);
                const existing = newMap.get(modID);
                if (existing) {
                    newMap.set(modID, { ...existing, position: { x: data.x, y: data.y } });
                }
                return newMap;
            });
            const newCords = [...patchCords];
            newCords.forEach((el) => {
                if (el.fromData.fromModID === modID) {
                    el.fromData.fromLocation = getCenterPoint(document.getElementById(modID + 'outputInner')!);
                } else if (el.toData!.tomyKey === modID) {
                    el.toData!.toLocation = getCenterPoint(document.getElementById(modID + 'inputInner')!);
                } else if (el.toData!.tomyKey.includes(' ') && getBaseModuleId(el.toData!.tomyKey) === modID) {
                    el.toData!.toLocation = getCenterPoint(
                        document.getElementById(el.toData!.tomyKey + ' inputInner')!
                    );
                }
            });
            setPatchCords(newCords);
        },
        [patchCords]
    );

    const handleDragStop = useCallback((modID: string, _e: DraggableEvent, data: DraggableData) => {
        setList((prev) => {
            const newMap = new Map(prev);
            const existing = newMap.get(modID);
            if (existing) {
                newMap.set(modID, { ...existing, position: { x: data.x, y: data.y } });
            }
            return newMap;
        });
    }, []);

    const handleResize = useCallback(() => {
        setPatchCords((prevCords) => {
            const newCords = [...prevCords];
            newCords.forEach((el) => {
                el.fromData.fromLocation = getCenterPoint(
                    document.getElementById(el.fromData.fromModID + 'outputInner')!
                );
                el.toData!.toLocation = getCenterPoint(document.getElementById(el.toData!.tomyKey + 'inputInner')!);
            });
            return newCords;
        });
    }, []);

    const handleNudge = useCallback(
        (modID: string, dx: number, dy: number) => {
            setList((prev) => {
                const newMap = new Map(prev);
                const existing = newMap.get(modID);
                if (existing) {
                    newMap.set(modID, {
                        ...existing,
                        position: { x: existing.position.x + dx, y: existing.position.y + dy },
                    });
                }
                return newMap;
            });
            requestAnimationFrame(handleResize);
        },
        [handleResize]
    );

    useEffect(() => {
        let rafId: number | null = null;
        const throttledResize = () => {
            if (rafId) return;
            rafId = requestAnimationFrame(() => {
                handleResize();
                rafId = null;
            });
        };
        window.addEventListener('resize', throttledResize);
        return () => {
            window.removeEventListener('resize', throttledResize);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [handleResize]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as Element;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
            if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                if (e.key === 'n' || e.key === 'N') {
                    e.preventDefault();
                    setPaletteOpen((prev) => !prev);
                } else if (e.key === 'm' || e.key === 'M') {
                    e.preventDefault();
                    toggleLearnMode();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleLearnMode]);

    // Focus newly added module's title bar after it renders
    useEffect(() => {
        const key = pendingFocusRef.current;
        if (!key) return;
        pendingFocusRef.current = null;
        const nodeRef = nodeRefs.get(key);
        if (!nodeRef?.current) return;
        const handle = nodeRef.current.querySelector<HTMLElement>('[data-module-handle]');
        handle?.focus();
    }, [list, nodeRefs]);

    // Escape cancels patch mode from anywhere
    useEffect(() => {
        if (!outputMode) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handlePatchExit();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [outputMode, handlePatchExit]);

    // In patch mode, Tab cycles only through valid input docks
    useEffect(() => {
        if (!outputMode) return;
        const handleTab = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;
            e.preventDefault();

            // Exclude the source module's own input dock to prevent self-patch tabbing
            const sourceDock = document.querySelector('.cordOuter.patchSource');
            const sourceInputDock = sourceDock?.closest('.moduleDiv')?.querySelector('[id="inputOuter"]');

            const docks = Array.from(
                document.querySelectorAll<HTMLElement>('[aria-label^="Connect to "]')
            ).filter((el) => el !== sourceInputDock);

            if (docks.length === 0) return;

            const currentIdx = docks.indexOf(document.activeElement as HTMLElement);
            let nextIdx: number;
            if (e.shiftKey) {
                nextIdx = currentIdx <= 0 ? docks.length - 1 : currentIdx - 1;
            } else {
                nextIdx = currentIdx < 0 || currentIdx >= docks.length - 1 ? 0 : currentIdx + 1;
            }
            docks[nextIdx].focus();
        };
        window.addEventListener('keydown', handleTab, true);
        return () => window.removeEventListener('keydown', handleTab, true);
    }, [outputMode]);

    // Process pending connections after preset load
    useEffect(() => {
        if (!pendingConnections) return;

        const tryConnect = () => {
            // Check all referenced modules are initialized
            const allReady = pendingConnections.every((conn) => {
                const toModBase = conn.toModID.endsWith(' param') ? getBaseModuleId(conn.toModID) : conn.toModID;
                if (toModBase === 'Output') return true;

                const fromRecord = list.get(conn.fromModID);
                const toRecord = list.get(toModBase);
                if (!fromRecord || !toRecord) return false;

                try {
                    fromRecord.module.getNode();
                    toRecord.module.getNode();
                    return true;
                } catch {
                    return false;
                }
            });

            if (!allReady) return false;

            const newCords: PatchCord[] = [];
            const newCombos: CordCombos = {};
            list.forEach((_mod, key) => {
                newCombos[key] = [];
            });

            let cordIdx = cumulativeCordCount;
            pendingConnections.forEach((conn) => {
                const fromRecord = list.get(conn.fromModID);
                if (!fromRecord) return;

                let fromNode: AudioNode;
                try {
                    fromNode = fromRecord.module.getNode();
                } catch {
                    return;
                }

                let toAudio: AudioNode | AudioParam | undefined;
                if (conn.toModID === 'Output') {
                    return;
                } else if (conn.toModID.endsWith(' param')) {
                    const baseId = getBaseModuleId(conn.toModID);
                    const toRecord = list.get(baseId);
                    if (!toRecord) return;
                    const paramNode = toRecord.module.getParamNode();
                    if (!paramNode) return;
                    toAudio = paramNode;
                } else {
                    const toRecord = list.get(conn.toModID);
                    if (!toRecord) return;
                    try {
                        toAudio = toRecord.module.getNode();
                    } catch {
                        return;
                    }
                }

                try {
                    fromNode.connect(toAudio as AudioNode);
                } catch {
                    return;
                }

                const fromEl = document.getElementById(conn.fromModID + 'outputInner');
                const toSuffix = conn.toModID.endsWith(' param')
                    ? conn.toModID + ' inputInner'
                    : conn.toModID + 'inputInner';
                const toEl = document.getElementById(toSuffix);

                const fromLocation = fromEl ? getCenterPoint(fromEl) : { x: 0, y: 0 };
                const toLocation = toEl ? getCenterPoint(toEl) : { x: 0, y: 0 };

                newCords.push({
                    id: 'cord' + cordIdx,
                    fromData: {
                        fromModID: conn.fromModID,
                        fromLocation,
                        audio: fromNode,
                    },
                    toData: {
                        tomyKey: conn.toModID,
                        toLocation,
                        audio: toAudio!,
                    },
                });

                if (newCombos[conn.fromModID]) {
                    newCombos[conn.fromModID].push(conn.toModID);
                }
                cordIdx++;
            });

            setPatchCords(newCords);
            setCumulativeCordCount(cordIdx);
            setCordCombos(newCombos);
            setPendingConnections(null);
            return true;
        };

        // Try immediately, then retry after a short delay for DOM elements
        if (!tryConnect()) {
            pendingCheckRef.current = setTimeout(() => {
                tryConnect();
            }, 50);
        }

        return () => {
            if (pendingCheckRef.current) {
                clearTimeout(pendingCheckRef.current);
            }
        };
    }, [pendingConnections, list, cumulativeCordCount]);

    const clearAll = useCallback(() => {
        // Disconnect all existing cords
        patchCords.forEach((cord) => {
            if (cord.toData) {
                try {
                    cord.fromData.audio.disconnect(cord.toData.audio as AudioNode);
                } catch {
                    // ignore
                }
            }
        });

        // Dispose all modules
        list.forEach((record) => {
            record.module.dispose();
        });

        nodeRefs.clear();
        setList(new Map());
        setPatchCords([]);
        setCumulativeCordCount(0);
        setCordCombos({});
        setOutputMode(false);
        setPatchSource(null);
        setAudioIn(false);
        setPendingConnections(null);
    }, [patchCords, nodeRefs, list]);

    const loadPreset = useCallback(
        (preset: Preset) => {
            // Clear existing state
            patchCords.forEach((cord) => {
                if (cord.toData) {
                    try {
                        cord.fromData.audio.disconnect(cord.toData.audio as AudioNode);
                    } catch {
                        // ignore
                    }
                }
            });

            // Dispose existing modules
            list.forEach((record) => {
                record.module.dispose();
            });

            nodeRefs.clear();

            // Compute module counts from preset
            const counts: Record<string, number> = {};
            preset.modules.forEach((mod) => {
                const parts = mod.key.split(' ');
                const type = parts[0];
                const num = parseInt(parts[1], 10);
                if (!counts[type] || counts[type] <= num) {
                    counts[type] = num + 1;
                }
            });

            // Build module list
            const newList = new Map<string, ModuleRecord>();
            const newCombos: CordCombos = {};
            let hasAudioIn = false;

            preset.modules.forEach((mod) => {
                const synthMod = createModule(mod.type);
                synthMod.init(audioContext);
                if (mod.params && Object.keys(mod.params).length > 0) {
                    synthMod.deserialize(mod.params);
                }

                newList.set(mod.key, {
                    myKey: mod.key,
                    filling: mod.type,
                    name: mod.type,
                    inputOnly: mod.inputOnly,
                    position: mod.position,
                    module: synthMod,
                });
                newCombos[mod.key] = [];
                if (mod.type === 'AudioInput') {
                    hasAudioIn = true;
                }
            });

            setModuleCounts(counts);
            setList(newList);
            setCordCombos(newCombos);
            setPatchCords([]);
            setCumulativeCordCount(0);
            setOutputMode(false);
            setPatchSource(null);
            setAudioIn(hasAudioIn);

            // Set pending connections to be processed after modules render
            if (preset.connections.length > 0) {
                setPendingConnections(preset.connections);
            }

            // Restore MIDI mappings
            loadMappings(preset.midiMappings?.mappings ?? []);
        },
        [patchCords, nodeRefs, audioContext, list, loadMappings]
    );

    const cords: ReactElement[] = [];
    const tempArr = [...patchCords];
    tempArr.forEach((el) => {
        if (el['toData']) {
            cords.push(
                <Cord
                    deleteCord={deleteCord}
                    key={el.id}
                    id={el.id}
                    x1={el.fromData.fromLocation.x}
                    y1={el.fromData.fromLocation.y}
                    x2={el.toData!.toLocation.x}
                    y2={el.toData!.toLocation.y}
                    fromName={getModuleType(el.fromData.fromModID)}
                    toName={getModuleType(el.toData!.tomyKey)}
                />
            );
        }
    });

    return (
        <div id="mainDiv">
            <div id="logo"></div>
            <div id="header">
                <div id="addModuleWrapper">
                    <button
                        className="presetBar__btn presetBar__btn--add"
                        onClick={() => setPaletteOpen((p) => !p)}
                        aria-label="Add module (N)"
                        title="Add module (N)"
                    >
                        <i className="fa fa-plus" aria-hidden="true" />
                        <span className="presetBar__shortcut" aria-hidden="true">N</span>
                    </button>
                    {paletteOpen && (
                        <ModulePalette
                            onAdd={(type, inputOnly) => { handleClick(type, inputOnly); }}
                            onClose={() => setPaletteOpen(false)}
                            audioIn={audioIn}
                        />
                    )}
                </div>
                <div className="midi-btn-wrapper tooltip">
                    <button
                        className={'presetBar__btn' + (learnMode ? ' midi-learn-active' : '')}
                        onClick={toggleLearnMode}
                        aria-label={learnMode ? 'Exit MIDI learn mode (M)' : 'Enter MIDI learn mode (M)'}
                    >
                        <span>MIDI</span>
                        <span className="presetBar__shortcut" aria-hidden="true">M</span>
                    </button>
                    <div className="tooltiptext midi-learn-tooltip" role="tooltip">
                        <strong>MIDI Learn</strong>
                        <ol>
                            <li>Press <kbd>M</kbd> or click to enter learn mode</li>
                            <li>Click (or focus + <kbd>Enter</kbd>) any knob or slider to arm it</li>
                            <li>Move a MIDI knob → CC mapped</li>
                            <li>Press a MIDI key on a frequency control → note mapped</li>
                            <li>Click the ADSR Gate button to map note-on/off to the envelope</li>
                            <li>Press <kbd>Esc</kbd> or <kbd>M</kbd> again to exit</li>
                        </ol>
                        <p>Mapped controls show an <kbd>M</kbd> badge. Mappings save with presets.</p>
                    </div>
                </div>
                <PresetBar list={list} patchCords={patchCords} onLoad={loadPreset} onClear={clearAll} getMIDIMappings={serializeMappings} />
            </div>
            <div id="sidebar"></div>
            <div id="playSpace">
                <svg id="patchCords" aria-label="Patch cord connections">
                    {cords}
                </svg>
                <AlertBox message={pingText} onDismiss={handlePingExit} />
                <button
                    id="patchExit"
                    onClick={handlePatchExit}
                    aria-label="Cancel patch"
                    className={outputMode ? 'show iconBtn' : 'hide iconBtn'}
                >
                    <i className="fa fa-times-circle" aria-hidden="true"></i>
                </button>

                {[...list].map(([key, { myKey, filling, name, inputOnly, position, module }]) => {
                    const ref = getNodeRef(key);
                    return (
                        <Draggable
                            onDrag={(e, data) => handleDrag(key, e, data)}
                            onStop={(e, data) => handleDragStop(key, e, data)}
                            key={key}
                            handle="p"
                            bounds="parent"
                            nodeRef={ref}
                            position={position}
                        >
                            <div className="dragDiv" ref={ref}>
                                <Area
                                    key={myKey}
                                    myKey={myKey}
                                    filling={filling}
                                    name={name}
                                    handleClose={handleClose}
                                    outputMode={outputMode}
                                    addPatch={addCord}
                                    handleOutput={handleOutput}
                                    inputOnly={inputOnly}
                                    alert={myAlert}
                                    patchSource={patchSource}
                                    module={module}
                                    handleNudge={handleNudge}
                                />
                            </div>
                        </Draggable>
                    );
                })}
                <Output handleOutput={handleOutput} />
            </div>
        </div>
    );
}
