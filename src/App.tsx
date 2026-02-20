import { useState, useCallback, useEffect, useRef, createRef, ReactElement } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import AlertBox from './components/AlertBox';
import Area from './components/Area';
import Cord from './components/Cord';
import Output from './components/Output';
import SideButtons from './components/SideButtons';
import PresetBar from './components/PresetBar';
import { getModuleType, getBaseModuleId, makeModuleId } from './utils/moduleId';
import { getCenterPoint } from './utils/centerPoint';
import { createModule } from './model/index';
import { useAudioContext } from './audio/AudioContextProvider';
import { PatchCord, CordFromData, CordToData, ModuleRecord, CordCombos, Preset, SerializedConnection } from './types';

export default function App() {
    const audioContext = useAudioContext();
    const [list, setList] = useState<Map<string, ModuleRecord>>(new Map());
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

    const pendingCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        (modID: string) => {
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
        },
        [patchCords, nodeRefs, audioContext, list]
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
                <PresetBar list={list} patchCords={patchCords} onLoad={loadPreset} onClear={clearAll} />
            </div>
            <div id="sidebar">
                <SideButtons id="sideButtons" handleClick={handleClick} audioIn={audioIn} />
            </div>
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
                            onDrag={() => {
                                handleDrag(key);
                            }}
                            onStop={(e, data) => handleDragStop(key, e, data)}
                            key={key}
                            handle="p"
                            bounds="parent"
                            nodeRef={ref}
                            defaultPosition={position}
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
