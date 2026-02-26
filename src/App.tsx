import { useState, useCallback, useEffect, useRef, createRef, ReactElement } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import AlertBox from './components/AlertBox';
import Area from './components/Area';
import Cord, { cablePath, cordColor } from './components/Cord';
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
    SerializedModule,
    Point,
    CanvasTransform,
    HistoryEntry,
} from './types';

/**
 * Minimum distance from point (px, py) to the quadratic bezier defined by
 * the same droop formula used in cablePath. Returns distance in canvas pixels.
 */
function pointToQuadBezierDist(
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
): number {
    const dx = x2 - x1, dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const droop = Math.max(60, dist * 0.5);
    const cpx = (x1 + x2) / 2;
    const cpy = (y1 + y2) / 2 + droop;
    let minDist = Infinity;
    for (let t = 0; t <= 1; t += 0.05) {
        const u = 1 - t;
        const bx = u * u * x1 + 2 * u * t * cpx + t * t * x2;
        const by = u * u * y1 + 2 * u * t * cpy + t * t * y2;
        const d = Math.sqrt((px - bx) ** 2 + (py - by) ** 2);
        if (d < minDist) minDist = d;
    }
    return minDist;
}

/** Distance threshold (canvas px) for cord insertion snap */
const CORD_INSERT_THRESHOLD = 30;

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

    // Multi-select
    const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());

    // Cord insertion — ID of the cord being hovered during a module drag
    const [cordDropTarget, setCordDropTarget] = useState<string | null>(null);

    // Undo/redo — initialize with an empty snapshot so index 0 is always valid
    const historyStack = useRef<HistoryEntry[]>([{ modules: [], connections: [] }]);
    const historyIndex = useRef<number>(0);

    // Infinite canvas state
    const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);

    // Refs for stable access inside event handlers / effects
    const panRef = useRef<Point>({ x: 0, y: 0 });
    const zoomRef = useRef(1);
    const playSpaceRef = useRef<HTMLDivElement>(null);
    const isPanning = useRef(false);
    const panStart = useRef({ mouseX: 0, mouseY: 0, panX: 0, panY: 0 });
    const dragPrevPos = useRef<{ x: number; y: number } | null>(null);

    // Rubber-band selection state
    const [rubberBand, setRubberBand] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
    const isRubberBanding = useRef(false);
    const rubberBandStart = useRef({ x: 0, y: 0 });

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

    // ─── Undo / Redo ────────────────────────────────────────────────────────────

    const captureSnapshot = useCallback(
        (newList: Map<string, ModuleRecord>, newCords: PatchCord[]) => {
            const modules: SerializedModule[] = [];
            newList.forEach((record, key) => {
                modules.push({
                    key,
                    type: record.filling,
                    inputOnly: record.inputOnly,
                    position: record.position,
                    params: record.module.serialize(),
                    displayName: record.name !== record.filling ? record.name : undefined,
                });
            });

            const connections: SerializedConnection[] = newCords
                .filter((c) => c.toData !== null)
                .map((c) => ({ fromModID: c.fromData.fromModID, toModID: c.toData!.tomyKey }));

            const entry: HistoryEntry = { modules, connections };

            // Truncate forward history
            historyStack.current = historyStack.current.slice(0, historyIndex.current + 1);
            historyStack.current.push(entry);
            if (historyStack.current.length > 50) {
                historyStack.current.shift();
            } else {
                historyIndex.current++;
            }
        },
        []
    );

    const restoreSnapshot = useCallback(
        (entry: HistoryEntry) => {
            // Disconnect all current cords
            setPatchCords((prev) => {
                prev.forEach((cord) => {
                    if (cord.toData) {
                        try { cord.fromData.audio.disconnect(cord.toData.audio as AudioNode); } catch { /* ignore */ }
                    }
                });
                return [];
            });

            // Dispose all current modules
            setList((prev) => {
                prev.forEach((record) => record.module.dispose());
                return new Map();
            });

            nodeRefs.clear();
            setCumulativeCordCount(0);
            setCordCombos({});
            setOutputMode(false);
            setPatchSource(null);
            setSelectedModules(new Set());

            // Rebuild modules
            const counts: Record<string, number> = {};
            entry.modules.forEach((mod) => {
                const parts = mod.key.split(' ');
                const type = parts[0];
                const num = parseInt(parts[1], 10);
                if (!isNaN(num) && (!counts[type] || counts[type] <= num)) {
                    counts[type] = num + 1;
                }
            });

            const newList = new Map<string, ModuleRecord>();
            const newCombos: CordCombos = {};
            let hasAudioIn = false;

            entry.modules.forEach((mod) => {
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
                if (mod.type === 'AudioInput') hasAudioIn = true;
            });

            setModuleCounts(counts);
            setList(newList);
            setCordCombos(newCombos);
            setAudioIn(hasAudioIn);

            if (entry.connections.length > 0) {
                setPendingConnections(entry.connections);
            }
        },
        [audioContext, nodeRefs]
    );

    const undo = useCallback(() => {
        if (historyIndex.current <= 0) return;
        historyIndex.current--;
        restoreSnapshot(historyStack.current[historyIndex.current]);
    }, [restoreSnapshot]);

    const redo = useCallback(() => {
        if (historyIndex.current >= historyStack.current.length - 1) return;
        historyIndex.current++;
        restoreSnapshot(historyStack.current[historyIndex.current]);
    }, [restoreSnapshot]);

    // No useEffect needed for initial snapshot — historyStack is pre-initialized with empty entry

    // ─── Patch cord helpers ──────────────────────────────────────────────────────

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

            const newRecord: ModuleRecord = {
                myKey: childKey,
                filling: type,
                name: type,
                inputOnly: inputOnly,
                position: { x: cx - 60, y: cy - 60 },
                module: mod,
            };

            setList((prev) => {
                const newMap = new Map(prev);
                newMap.set(childKey, newRecord);
                captureSnapshot(newMap, patchCords);
                return newMap;
            });
        },
        [outputMode, handlePatchExit, moduleCounts, audioContext, captureSnapshot, patchCords]
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

            let cordsAfter: PatchCord[] = [];
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
                cordsAfter = prevCords.filter((el) => !toRemove.includes(el));
                return cordsAfter;
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

            setSelectedModules((prev) => {
                const next = new Set(prev);
                next.delete(childKey);
                return next;
            });

            // Capture snapshot synchronously using the list state updater
            setList((prev) => {
                captureSnapshot(prev, cordsAfter);
                return prev;
            });
        },
        [nodeRefs, list, captureSnapshot]
    );

    // Delete all selected modules
    const handleDeleteSelected = useCallback(() => {
        if (selectedModules.size === 0) return;
        const toDelete = new Set(selectedModules);

        const newList = new Map(list);
        let newCords = [...patchCords];
        const newCombos = { ...cordCombos };

        toDelete.forEach((childKey) => {
            const record = newList.get(childKey);
            if (record) record.module.dispose();
            nodeRefs.delete(childKey);
            newList.delete(childKey);

            newCords = newCords.filter((el) => {
                const isFrom = el.fromData.fromModID === childKey;
                const isTo =
                    el.toData !== null &&
                    (el.toData.tomyKey === childKey || getBaseModuleId(el.toData.tomyKey) === childKey);
                if ((isFrom || isTo) && el.toData) {
                    try { el.fromData.audio.disconnect(el.toData.audio as AudioNode); } catch { /* ignore */ }
                }
                return !isFrom && !isTo;
            });

            Object.keys(newCombos).forEach((key) => {
                if (Array.isArray(newCombos[key])) {
                    newCombos[key] = newCombos[key].filter((v) => v !== childKey);
                }
            });
            delete newCombos[childKey];

            if (getModuleType(childKey) === 'AudioInput') setAudioIn(false);
        });

        setList(newList);
        setPatchCords(newCords);
        setCordCombos(newCombos);
        setSelectedModules(new Set());
        captureSnapshot(newList, newCords);
    }, [selectedModules, list, patchCords, cordCombos, nodeRefs, captureSnapshot]);

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
                        // Capture snapshot synchronously with the finalized cords
                        setList((currentList) => {
                            captureSnapshot(currentList, newCords);
                            return currentList;
                        });
                        return newCords;
                    }
                });
                setPatchSource(null);
                setOutputMode(false);
            }
        },
        [outputMode, cordCombos, myAlert, captureSnapshot]
    );

    const deleteCord = useCallback((cordID: string) => {
        let cordsAfter: PatchCord[] = [];
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
            cordsAfter = prevCords.filter((el) => el.id !== cordID);
            return cordsAfter;
        });
        setList((currentList) => {
            captureSnapshot(currentList, cordsAfter);
            return currentList;
        });
    }, [captureSnapshot]);

    /**
     * Given a module ID, returns its center position in canvas coordinates
     * by reading from the DOM (valid during/after a drag event).
     */
    const getModuleCanvasCenter = useCallback((modID: string): { x: number; y: number } | null => {
        const ref = nodeRefs.get(modID);
        if (!ref?.current) return null;
        const r = ref.current.getBoundingClientRect();
        const psRect = playSpaceRef.current?.getBoundingClientRect();
        if (!psRect) return null;
        return {
            x: (r.left + r.width / 2 - psRect.left - panRef.current.x) / zoomRef.current,
            y: (r.top + r.height / 2 - psRect.top - panRef.current.y) / zoomRef.current,
        };
    }, [nodeRefs]);

    /**
     * Find the nearest eligible cord to snap a dragged module into.
     * Returns the cord or null if none is within threshold.
     */
    const findCordDropTarget = useCallback(
        (modID: string, cx: number, cy: number): PatchCord | null => {
            const record = list.get(modID);
            // Only effect modules (bidirectional, non-sink) can be inserted
            if (!record || record.inputOnly || record.module.sinkOnly) return null;
            if (outputMode) return null;

            let bestCord: PatchCord | null = null;
            let bestDist = CORD_INSERT_THRESHOLD;

            patchCords.forEach((cord) => {
                if (!cord.toData) return;
                // Skip cords already touching this module
                if (cord.fromData.fromModID === modID) return;
                const toBase = getBaseModuleId(cord.toData.tomyKey);
                if (cord.toData.tomyKey === modID || toBase === modID) return;

                const d = pointToQuadBezierDist(
                    cx, cy,
                    cord.fromData.fromLocation.x, cord.fromData.fromLocation.y,
                    cord.toData.toLocation.x, cord.toData.toLocation.y
                );
                if (d < bestDist) {
                    bestDist = d;
                    bestCord = cord;
                }
            });

            return bestCord;
        },
        [list, patchCords, outputMode]
    );

    /**
     * Insert module `modKey` into `cord`, replacing A→C with A→modKey→C.
     */
    const insertIntoCord = useCallback(
        (modKey: string, cord: PatchCord) => {
            const record = list.get(modKey);
            if (!record || !cord.toData) return;

            const fromModKey = cord.fromData.fromModID;
            const toModKey = cord.toData.tomyKey;
            const fromAudio = cord.fromData.audio;
            const toAudio = cord.toData.audio;

            // Disconnect old audio connection
            try { (fromAudio as AudioNode).disconnect(toAudio as AudioNode); } catch { /* ignore */ }

            // Wire new audio path: source → new module → destination
            const newInputNode = record.module.getInputNode();
            const newOutputNode = record.module.getOutputNode() ?? record.module.getNode();
            try { (fromAudio as AudioNode).connect(newInputNode); } catch { /* ignore */ }
            try { newOutputNode.connect(toAudio as AudioNode); } catch { /* ignore */ }

            const transform = getCanvasTransform();
            const fromEl = document.getElementById(fromModKey + 'outputInner');
            const modInEl = document.getElementById(modKey + 'inputInner');
            const modOutEl = document.getElementById(modKey + 'outputInner');
            const toSuffix = toModKey.endsWith(' param') ? toModKey + ' inputInner' : toModKey + 'inputInner';
            const toEl = document.getElementById(toSuffix);

            const fromLoc = fromEl ? getCenterPoint(fromEl, transform) : cord.fromData.fromLocation;
            const modInLoc = modInEl ? getCenterPoint(modInEl, transform) : { x: 0, y: 0 };
            const modOutLoc = modOutEl ? getCenterPoint(modOutEl, transform) : { x: 0, y: 0 };
            const toLoc = toEl ? getCenterPoint(toEl, transform) : cord.toData.toLocation;

            let finalCords: PatchCord[] = [];
            setCumulativeCordCount((count) => {
                const id1 = 'cord' + count;
                const id2 = 'cord' + (count + 1);

                setPatchCords((prev) => {
                    const newCords = prev.filter((c) => c.id !== cord.id);
                    newCords.push({
                        id: id1,
                        fromData: { fromModID: fromModKey, fromLocation: fromLoc, audio: fromAudio },
                        toData: { tomyKey: modKey, toLocation: modInLoc, audio: newInputNode },
                    });
                    newCords.push({
                        id: id2,
                        fromData: { fromModID: modKey, fromLocation: modOutLoc, audio: newOutputNode },
                        toData: { tomyKey: toModKey, toLocation: toLoc, audio: toAudio },
                    });
                    finalCords = newCords;
                    return newCords;
                });

                return count + 2;
            });

            setCordCombos((prev) => {
                const nc = { ...prev };
                // Remove old A→C combo
                if (nc[fromModKey]) nc[fromModKey] = nc[fromModKey].filter((v) => v !== toModKey);
                // Add A→modKey and modKey→C
                if (nc[fromModKey] && !nc[fromModKey].includes(modKey)) nc[fromModKey] = [...nc[fromModKey], modKey];
                if (nc[modKey] && !nc[modKey].includes(toModKey)) nc[modKey] = [...nc[modKey], toModKey];
                return nc;
            });

            setList((currentList) => {
                captureSnapshot(currentList, finalCords);
                return currentList;
            });
        },
        [list, getCanvasTransform, captureSnapshot]
    );

    const handleDragStart = useCallback((_modID: string, _e: DraggableEvent, data: DraggableData) => {
        dragPrevPos.current = { x: data.x, y: data.y };
    }, []);

    const handleDrag = useCallback(
        (modID: string, _e: DraggableEvent, data: DraggableData) => {
            const isGroup = selectedModules.has(modID);

            // Incremental delta since last drag event — used for group cord updates
            const prv = dragPrevPos.current;
            const dx = prv ? data.x - prv.x : 0;
            const dy = prv ? data.y - prv.y : 0;
            dragPrevPos.current = { x: data.x, y: data.y };

            setList((prev) => {
                const newMap = new Map(prev);
                const existing = newMap.get(modID);
                if (!existing) return prev;

                if (isGroup) {
                    selectedModules.forEach((selKey) => {
                        const sel = newMap.get(selKey);
                        if (sel) {
                            newMap.set(selKey, {
                                ...sel,
                                position: { x: sel.position.x + dx, y: sel.position.y + dy },
                            });
                        }
                    });
                } else {
                    newMap.set(modID, { ...existing, position: { x: data.x, y: data.y } });
                }
                return newMap;
            });

            const transform = getCanvasTransform();
            const newCords = [...patchCords];

            if (isGroup) {
                // Shift cord endpoints for every selected module by the same delta
                newCords.forEach((el) => {
                    if (selectedModules.has(el.fromData.fromModID)) {
                        el.fromData.fromLocation = {
                            x: el.fromData.fromLocation.x + dx,
                            y: el.fromData.fromLocation.y + dy,
                        };
                    }
                    if (el.toData) {
                        const toBase = el.toData.tomyKey.includes(' ')
                            ? getBaseModuleId(el.toData.tomyKey)
                            : el.toData.tomyKey;
                        if (selectedModules.has(toBase)) {
                            el.toData.toLocation = {
                                x: el.toData.toLocation.x + dx,
                                y: el.toData.toLocation.y + dy,
                            };
                        }
                    }
                });
            } else {
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
            }

            setPatchCords(newCords);

            // Update cord drop target highlight during drag
            const center = getModuleCanvasCenter(modID);
            if (center) {
                const target = findCordDropTarget(modID, center.x, center.y);
                setCordDropTarget(target ? target.id : null);
            }
        },
        [patchCords, getCanvasTransform, selectedModules, getModuleCanvasCenter, findCordDropTarget]
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
        setCordDropTarget(null);

        // Cord insertion: snap module into a nearby patch cord
        const center = getModuleCanvasCenter(modID);
        if (center) {
            const target = findCordDropTarget(modID, center.x, center.y);
            if (target) {
                insertIntoCord(modID, target);
            }
        }
    }, [getModuleCanvasCenter, findCordDropTarget, insertIntoCord]);

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
                if (selectedModules.has(modID)) {
                    // Nudge all selected modules
                    selectedModules.forEach((selKey) => {
                        const sel = newMap.get(selKey);
                        if (sel) {
                            newMap.set(selKey, {
                                ...sel,
                                position: { x: sel.position.x + dx, y: sel.position.y + dy },
                            });
                        }
                    });
                } else {
                    const existing = newMap.get(modID);
                    if (existing) {
                        newMap.set(modID, {
                            ...existing,
                            position: { x: existing.position.x + dx, y: existing.position.y + dy },
                        });
                    }
                }
                return newMap;
            });
            requestAnimationFrame(handleResize);
        },
        [handleResize, selectedModules]
    );

    const handleRename = useCallback((key: string, newName: string) => {
        setList((prev) => {
            const m = new Map(prev);
            const r = m.get(key);
            const filling = r?.filling ?? key;
            if (r) m.set(key, { ...r, name: newName || filling });
            captureSnapshot(m, patchCords);
            return m;
        });
    }, [captureSnapshot, patchCords]);

    // Duplicate module
    const handleDuplicate = useCallback(
        (key: string) => {
            const record = list.get(key);
            if (!record) return;

            const type = record.filling;
            const count = moduleCounts[type] || 0;
            const newKey = makeModuleId(type, count);
            setModuleCounts((prev) => ({ ...prev, [type]: count + 1 }));

            const newMod = createModule(type);
            newMod.init(audioContext);
            newMod.deserialize(record.module.serialize());

            const newRecord: ModuleRecord = {
                myKey: newKey,
                filling: type,
                name: record.name,
                inputOnly: record.inputOnly,
                position: { x: record.position.x + 30, y: record.position.y + 30 },
                module: newMod,
            };

            setCordCombos((prev) => ({ ...prev, [newKey]: [] }));
            pendingFocusRef.current = newKey;

            setList((prev) => {
                const newMap = new Map(prev);
                newMap.set(newKey, newRecord);
                captureSnapshot(newMap, patchCords);
                return newMap;
            });
        },
        [list, moduleCounts, audioContext, patchCords, captureSnapshot]
    );

    // Select / deselect module
    const handleSelect = useCallback((key: string) => {
        setSelectedModules((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
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
            const inInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

            if (e.ctrlKey || e.metaKey) {
                if (e.key === '0') {
                    e.preventDefault();
                    setPan({ x: 0, y: 0 });
                    setZoom(1);
                } else if (e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    undo();
                } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
                    e.preventDefault();
                    redo();
                } else if (e.key === 'a') {
                    e.preventDefault();
                    setSelectedModules((prev) => {
                        if (prev.size === list.size) return new Set(); // toggle off if all selected
                        return new Set([...list.keys()]);
                    });
                }
            } else if (!e.altKey && !inInput) {
                if (e.key === 'n' || e.key === 'N') {
                    e.preventDefault();
                    setPaletteOpen((prev) => !prev);
                } else if (e.key === 'm' || e.key === 'M') {
                    e.preventDefault();
                    toggleLearnMode();
                } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedModules.size > 0) {
                    e.preventDefault();
                    handleDeleteSelected();
                } else if (e.key === 'Escape') {
                    if (!outputMode && selectedModules.size > 0) {
                        e.preventDefault();
                        setSelectedModules(new Set());
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleLearnMode, undo, redo, list, selectedModules, handleDeleteSelected, outputMode]);

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
                    fromNode = fromRecord.module.getOutputNode() ?? fromRecord.module.getNode();
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
        setSelectedModules(new Set());
        // Reset history to single empty snapshot
        historyStack.current = [{ modules: [], connections: [] }];
        historyIndex.current = 0;
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
            setSelectedModules(new Set());

            if (preset.connections.length > 0) {
                setPendingConnections(preset.connections);
            }

            loadMappings(preset.midiMappings?.mappings ?? []);
            // Reset history with the loaded preset as the base state
            const presetEntry: HistoryEntry = {
                modules: preset.modules,
                connections: preset.connections,
            };
            historyStack.current = [presetEntry];
            historyIndex.current = 0;
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
                    highlighted={el.id === cordDropTarget}
                    color={cordColor(el.id)}
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
                <div className="infoBtn__wrap">
                    <button
                        className="presetBar__btn"
                        aria-label="Keyboard shortcuts"
                    >
                        <span>Keys</span>
                        <i className="fa fa-keyboard-o presetBar__shortcut" aria-hidden="true" />
                    </button>
                    <div className="infoDropdown">
                        <div className="infoDropdown__section">
                            <div className="infoDropdown__heading">Module</div>
                            <table className="infoDropdown__table">
                                <tbody>
                                    <tr><td><kbd>Del</kbd> / <kbd>⌫</kbd></td><td>Delete module</td></tr>
                                    <tr><td><kbd>Ctrl+D</kbd></td><td>Duplicate</td></tr>
                                    <tr><td><kbd>Ctrl+Click</kbd> title</td><td>Add to selection</td></tr>
                                    <tr><td><kbd>Arrow keys</kbd></td><td>Nudge position</td></tr>
                                    <tr><td><kbd>Enter</kbd></td><td>Focus first control</td></tr>
                                    <tr><td>Double-click name</td><td>Rename</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="infoDropdown__section">
                            <div className="infoDropdown__heading">Global</div>
                            <table className="infoDropdown__table">
                                <tbody>
                                    <tr><td><kbd>Ctrl+Z</kbd></td><td>Undo</td></tr>
                                    <tr><td><kbd>Ctrl+Y</kbd></td><td>Redo</td></tr>
                                    <tr><td><kbd>Ctrl+A</kbd></td><td>Select all</td></tr>
                                    <tr><td><kbd>Del</kbd> (selection)</td><td>Delete selected</td></tr>
                                    <tr><td><kbd>Esc</kbd></td><td>Clear selection</td></tr>
                                    <tr><td><kbd>N</kbd></td><td>Open module palette</td></tr>
                                    <tr><td><kbd>M</kbd></td><td>MIDI learn mode</td></tr>
                                    <tr><td><kbd>Alt+drag</kbd></td><td>Pan canvas</td></tr>
                                    <tr><td><kbd>Ctrl+scroll</kbd></td><td>Zoom</td></tr>
                                    <tr><td><kbd>Ctrl+0</kbd></td><td>Reset zoom</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <PresetBar list={list} patchCords={patchCords} onLoad={loadPreset} onClear={clearAll} getMIDIMappings={serializeMappings} />
            </div>
            <div id="sidebar"></div>
            <div
                id="playSpace"
                ref={playSpaceRef}
                onPointerDown={(e) => {
                    // Only handle clicks on the playSpace or canvas background
                    const id = (e.target as Element).id;
                    if (id !== 'playSpace' && id !== 'canvas') return;

                    const psEl = e.currentTarget as HTMLDivElement;
                    psEl.setPointerCapture(e.pointerId);

                    // Middle button or alt+drag = pan
                    if (e.button === 1 || e.altKey) {
                        isPanning.current = true;
                        panStart.current = { mouseX: e.clientX, mouseY: e.clientY, panX: pan.x, panY: pan.y };
                        psEl.style.cursor = 'grabbing';
                        return;
                    }

                    // Left button = rubber-band selection
                    if (e.button === 0) {
                        if (!e.ctrlKey && !e.metaKey) setSelectedModules(new Set());
                        const rect = psEl.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        isRubberBanding.current = true;
                        rubberBandStart.current = { x, y };
                        setRubberBand({ x1: x, y1: y, x2: x, y2: y });
                    }
                }}
                onPointerMove={(e) => {
                    if (isPanning.current) {
                        setPan({
                            x: panStart.current.panX + e.clientX - panStart.current.mouseX,
                            y: panStart.current.panY + e.clientY - panStart.current.mouseY,
                        });
                        return;
                    }
                    if (isRubberBanding.current) {
                        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        setRubberBand({ x1: rubberBandStart.current.x, y1: rubberBandStart.current.y, x2: x, y2: y });
                    }
                }}
                onPointerUp={(e) => {
                    const psEl = e.currentTarget as HTMLDivElement;
                    psEl.releasePointerCapture(e.pointerId);

                    if (isPanning.current) {
                        isPanning.current = false;
                        psEl.style.cursor = '';
                        return;
                    }

                    if (isRubberBanding.current) {
                        isRubberBanding.current = false;
                        setRubberBand((rb) => {
                            if (!rb) return null;
                            const rx1 = Math.min(rb.x1, rb.x2);
                            const ry1 = Math.min(rb.y1, rb.y2);
                            const rx2 = Math.max(rb.x1, rb.x2);
                            const ry2 = Math.max(rb.y1, rb.y2);
                            // Only select if dragged a meaningful distance
                            if (rx2 - rx1 > 4 || ry2 - ry1 > 4) {
                                const psRect = playSpaceRef.current?.getBoundingClientRect();
                                if (psRect) {
                                    const newSelected = new Set<string>();
                                    nodeRefs.forEach((ref, key) => {
                                        if (!ref.current) return;
                                        const r = ref.current.getBoundingClientRect();
                                        const mx1 = r.left - psRect.left;
                                        const my1 = r.top - psRect.top;
                                        const mx2 = r.right - psRect.left;
                                        const my2 = r.bottom - psRect.top;
                                        if (mx2 > rx1 && mx1 < rx2 && my2 > ry1 && my1 < ry2) {
                                            newSelected.add(key);
                                        }
                                    });
                                    setSelectedModules(newSelected);
                                }
                            }
                            return null;
                        });
                    }
                }}
                onPointerCancel={() => {
                    isPanning.current = false;
                    isRubberBanding.current = false;
                    setRubberBand(null);
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
                                onStart={(e, data) => handleDragStart(key, e, data)}
                                onDrag={(e, data) => handleDrag(key, e, data)}
                                onStop={(e, data) => handleDragStop(key, e, data)}
                                key={key}
                                handle="header"
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
                                        isSelected={selectedModules.has(myKey)}
                                        onSelect={handleSelect}
                                        onDuplicate={handleDuplicate}
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

                {rubberBand && (
                    <div
                        className="rubber-band"
                        style={{
                            left: Math.min(rubberBand.x1, rubberBand.x2),
                            top: Math.min(rubberBand.y1, rubberBand.y2),
                            width: Math.abs(rubberBand.x2 - rubberBand.x1),
                            height: Math.abs(rubberBand.y2 - rubberBand.y1),
                        }}
                    />
                )}

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
