import { useState, useCallback, useEffect, useRef, createRef, ReactElement } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import AlertBox from './components/AlertBox';
import Area from './components/Area';
import Cord, { cablePath } from './components/Cord';
import ModulePalette from './components/ModulePalette';
import PresetBar from './components/PresetBar';
import { getModuleType, getBaseModuleId, makeModuleId } from './utils/moduleId';
import { getCenterPoint } from './utils/centerPoint';
import { createModule } from './model/index';
import { useAudioContext } from './audio/AudioContextProvider';
import { useMIDILearn } from './midi/MIDILearnContext';
import { useMIDIPlayback } from './midi/useMIDIPlayback';
import {
    PatchCord,
    CordFromData,
    CordToData,
    ModuleRecord,
    CordCombos,
    Preset,
    SerializedConnection,
    Point,
    CanvasTransform,
} from './types';

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
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
    const [invalidFlashTarget, setInvalidFlashTarget] = useState<string | null>(null);

    // Infinite canvas state
    const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);

    // Refs for stable access inside event handlers / effects
    const panRef = useRef<Point>({ x: 0, y: 0 });
    const zoomRef = useRef(1);
    const playSpaceRef = useRef<HTMLDivElement>(null);
    const isPanning = useRef(false);
    const panStart = useRef({ mouseX: 0, mouseY: 0, panX: 0, panY: 0 });

    // Keep refs in sync with state (assignment in render body is intentional)
    panRef.current = pan;
    zoomRef.current = zoom;

    const pendingCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingFocusRef = useRef<string | null>(null);

    // Stable transform accessor — reads refs so it never goes stale
    const getCanvasTransform = useCallback((): CanvasTransform => {
        const r = playSpaceRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
        return {
            panX: panRef.current.x,
            panY: panRef.current.y,
            zoom: zoomRef.current,
            playSpaceLeft: r.left,
            playSpaceTop: r.top,
        };
    }, []);

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

            // Spawn new modules at the current viewport centre in canvas space
            const rect = playSpaceRef.current?.getBoundingClientRect();
            const vpW = rect?.width ?? 800;
            const vpH = rect?.height ?? 600;
            const cx = (vpW / 2 - panRef.current.x) / zoomRef.current;
            const cy = (vpH / 2 - panRef.current.y) / zoomRef.current;

            setList((prev) => {
                const newMap = new Map(prev);
                newMap.set(childKey, {
                    myKey: childKey,
                    filling: type,
                    name: type,
                    inputOnly: inputOnly,
                    position: { x: cx - 60, y: cy - 60 },
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
                    const isFrom = el.fromData.fromModID === childKey;
                    const isTo =
                        el.toData !== null &&
                        (el.toData.tomyKey === childKey ||
                            getBaseModuleId(el.toData.tomyKey) === childKey);
                    if (isFrom || isTo) {
                        toRemove.push(el);
                        if (el.toData) {
                            try {
                                el.fromData.audio.disconnect(el.toData.audio as AudioNode);
                            } catch {
                                // dispose() already called node.disconnect() on outgoing cords
                            }
                        }
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
                        setInvalidFlashTarget(info.tomyKey);
                        setTimeout(() => setInvalidFlashTarget(null), 400);
                        return prevCords.slice(0, -1);
                    } else if (cordCombos[fromMod] && cordCombos[fromMod].includes(info.tomyKey)) {
                        myAlert("You've already patched this cable!");
                        setInvalidFlashTarget(info.tomyKey);
                        setTimeout(() => setInvalidFlashTarget(null), 400);
                        return prevCords.slice(0, -1);
                    } else if (info.tomyKey.includes(fromMod)) {
                        myAlert('Hahaha thats a new one. Nice try.');
                        setInvalidFlashTarget(info.tomyKey);
                        setTimeout(() => setInvalidFlashTarget(null), 400);
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
            const transform = getCanvasTransform();
            const newCords = [...patchCords];
            newCords.forEach((el) => {
                if (el.fromData.fromModID === modID) {
                    el.fromData.fromLocation = getCenterPoint(
                        document.getElementById(modID + 'outputInner')!,
                        transform
                    );
                } else if (el.toData!.tomyKey === modID) {
                    el.toData!.toLocation = getCenterPoint(
                        document.getElementById(modID + 'inputInner')!,
                        transform
                    );
                } else if (el.toData!.tomyKey.includes(' ') && getBaseModuleId(el.toData!.tomyKey) === modID) {
                    el.toData!.toLocation = getCenterPoint(
                        document.getElementById(el.toData!.tomyKey + ' inputInner')!,
                        transform
                    );
                }
            });
            setPatchCords(newCords);
        },
        [patchCords, getCanvasTransform]
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
        const transform = getCanvasTransform();
        setPatchCords((prevCords) => {
            const newCords = [...prevCords];
            newCords.forEach((el) => {
                el.fromData.fromLocation = getCenterPoint(
                    document.getElementById(el.fromData.fromModID + 'outputInner')!,
                    transform
                );
                el.toData!.toLocation = getCenterPoint(
                    document.getElementById(el.toData!.tomyKey + 'inputInner')!,
                    transform
                );
            });
            return newCords;
        });
    }, [getCanvasTransform]);

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

    const handleRename = useCallback((key: string, newName: string) => {
        setList((prev) => {
            const m = new Map(prev);
            const r = m.get(key);
            const filling = r?.filling ?? key;
            if (r) m.set(key, { ...r, name: newName || filling });
            return m;
        });
    }, []);

    // Window resize — throttled via rAF
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

    // Non-passive wheel handler for pan + zoom
    useEffect(() => {
        const el = playSpaceRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (e.ctrlKey || e.metaKey) {
                const r = el.getBoundingClientRect();
                const mx = e.clientX - r.left;
                const my = e.clientY - r.top;
                setZoom((prev) => {
                    const factor = e.deltaY < 0 ? 1.08 : 0.93;
                    const next = Math.min(Math.max(prev * factor, 0.25), 3);
                    setPan((p) => ({
                        x: mx - (mx - p.x) * (next / prev),
                        y: my - (my - p.y) * (next / prev),
                    }));
                    return next;
                });
            } else {
                setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
            }
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    // Global keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as Element;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
            if (e.ctrlKey || e.metaKey) {
                if (e.key === '0') {
                    e.preventDefault();
                    setPan({ x: 0, y: 0 });
                    setZoom(1);
                }
            } else if (!e.altKey) {
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

    // Ghost cord — mouse position in canvas space
    useEffect(() => {
        if (!outputMode) {
            setMousePos(null);
            return;
        }
        const handleMouseMove = (e: MouseEvent) => {
            const r = playSpaceRef.current?.getBoundingClientRect();
            if (!r) return;
            setMousePos({
                x: (e.clientX - r.left - panRef.current.x) / zoomRef.current,
                y: (e.clientY - r.top - panRef.current.y) / zoomRef.current,
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [outputMode]);

    // Process pending connections after preset load
    useEffect(() => {
        if (!pendingConnections) return;

        const tryConnect = () => {
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

            const transform = getCanvasTransform();
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

                const fromLocation = fromEl ? getCenterPoint(fromEl, transform) : { x: 0, y: 0 };
                const toLocation = toEl ? getCenterPoint(toEl, transform) : { x: 0, y: 0 };

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
    }, [pendingConnections, list, cumulativeCordCount, getCanvasTransform]);

    const clearAll = useCallback(() => {
        patchCords.forEach((cord) => {
            if (cord.toData) {
                try {
                    cord.fromData.audio.disconnect(cord.toData.audio as AudioNode);
                } catch {
                    // ignore
                }
            }
        });

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
            patchCords.forEach((cord) => {
                if (cord.toData) {
                    try {
                        cord.fromData.audio.disconnect(cord.toData.audio as AudioNode);
                    } catch {
                        // ignore
                    }
                }
            });

            list.forEach((record) => {
                record.module.dispose();
            });

            nodeRefs.clear();

            const counts: Record<string, number> = {};
            preset.modules.forEach((mod) => {
                const parts = mod.key.split(' ');
                const type = parts[0];
                const num = parseInt(parts[1], 10);
                if (!counts[type] || counts[type] <= num) {
                    counts[type] = num + 1;
                }
            });

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
                    name: mod.displayName ?? mod.type,
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

            if (preset.connections.length > 0) {
                setPendingConnections(preset.connections);
            }

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
            <div
                id="playSpace"
                ref={playSpaceRef}
                onPointerDown={(e) => {
                    // Only start panning when clicking on the playSpace or canvas background
                    const id = (e.target as Element).id;
                    if (id !== 'playSpace' && id !== 'canvas') return;
                    isPanning.current = true;
                    panStart.current = {
                        mouseX: e.clientX,
                        mouseY: e.clientY,
                        panX: pan.x,
                        panY: pan.y,
                    };
                    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
                    (e.currentTarget as HTMLDivElement).style.cursor = 'grabbing';
                }}
                onPointerMove={(e) => {
                    if (!isPanning.current) return;
                    setPan({
                        x: panStart.current.panX + e.clientX - panStart.current.mouseX,
                        y: panStart.current.panY + e.clientY - panStart.current.mouseY,
                    });
                }}
                onPointerUp={(e) => {
                    if (!isPanning.current) return;
                    isPanning.current = false;
                    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
                    (e.currentTarget as HTMLDivElement).style.cursor = '';
                }}
                onPointerCancel={() => {
                    isPanning.current = false;
                }}
            >
                {/* Canvas — everything inside is transformed together */}
                <div
                    id="canvas"
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: '0 0',
                    }}
                >
                    <svg id="patchCords" aria-label="Patch cord connections">
                        {cords}
                        {outputMode && mousePos && patchCords.length > 0 && (() => {
                            const src = patchCords[patchCords.length - 1].fromData.fromLocation;
                            return (
                                <path
                                    className="cord-ghost"
                                    d={cablePath(src.x, src.y, mousePos.x, mousePos.y)}
                                    fill="none"
                                />
                            );
                        })()}
                    </svg>

                    {[...list].map(([key, { myKey, filling, name, inputOnly, position, module }]) => {
                        const ref = getNodeRef(key);
                        return (
                            <Draggable
                                onDrag={(e, data) => handleDrag(key, e, data)}
                                onStop={(e, data) => handleDragStop(key, e, data)}
                                key={key}
                                handle="p"
                                cancel="input"
                                nodeRef={ref}
                                position={position}
                                scale={zoom}
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
                                        getCanvasTransform={getCanvasTransform}
                                        onRename={handleRename}
                                        isFlashing={invalidFlashTarget === myKey}
                                    />
                                </div>
                            </Draggable>
                        );
                    })}

                </div>

                {/* Zoom controls — fixed to playSpace corner, outside canvas */}
                <div className="zoom-controls">
                    <button
                        className="zoom-controls__btn iconBtn"
                        onClick={() => setZoom((z) => Math.min(z * 1.2, 3))}
                        aria-label="Zoom in"
                    >+</button>
                    <button
                        className="zoom-controls__btn zoom-controls__btn--reset iconBtn"
                        onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1); }}
                        aria-label="Reset zoom (Ctrl+0)"
                        title="Reset zoom (Ctrl+0)"
                    >{Math.round(zoom * 100)}%</button>
                    <button
                        className="zoom-controls__btn iconBtn"
                        onClick={() => setZoom((z) => Math.max(z * 0.8, 0.25))}
                        aria-label="Zoom out"
                    >−</button>
                </div>

                <AlertBox message={pingText} onDismiss={handlePingExit} />
                <button
                    id="patchExit"
                    onClick={handlePatchExit}
                    aria-label="Cancel patch"
                    className={outputMode ? 'show iconBtn' : 'hide iconBtn'}
                >
                    <i className="fa fa-times-circle" aria-hidden="true"></i>
                </button>
            </div>
        </div>
    );
}
