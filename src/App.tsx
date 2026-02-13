import { useState, useCallback, useEffect, createRef, ReactElement } from 'react';
import Draggable from 'react-draggable';
import AlertBox from './components/AlertBox';
import Area from './components/Area';
import Cord from './components/Cord';
import Output from './components/Output';
import SideButtons from './components/SideButtons';
import { getModuleType, getBaseModuleId } from './utils/moduleId';
import { getCenterPoint } from './utils/centerPoint';
import { PatchCord, CordFromData, CordToData, ModuleRecord, CordCombos } from './types';

export default function App() {
    const [list, setList] = useState<Map<string, ModuleRecord>>(new Map());
    const [patchCords, setPatchCords] = useState<PatchCord[]>([]);
    const [cumulativeCordCount, setCumulativeCordCount] = useState(0);
    const [outputMode, setOutputMode] = useState(false);
    const [cordCombos, setCordCombos] = useState<CordCombos>({});
    const [pingText, setPingText] = useState('');
    const [audioIn, setAudioIn] = useState(false);
    const [patchSource, setPatchSource] = useState<string | null>(null);
    const [nodeRefs] = useState(() => new Map<string, React.RefObject<HTMLDivElement>>());

    const getNodeRef = useCallback((key: string) => {
        if (!nodeRefs.has(key)) {
            nodeRefs.set(key, createRef<HTMLDivElement>());
        }
        return nodeRefs.get(key)!;
    }, [nodeRefs]);

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
        (childKey: string, childJSX: string, inputOnly: boolean) => {
            if (outputMode) {
                handlePatchExit();
            }
            if (getModuleType(childKey) === 'AudioInput') {
                setAudioIn(true);
            }
            setCordCombos((prev) => ({ ...prev, [childKey]: [] }));
            setList((prev) => {
                const newMap = new Map(prev);
                newMap.set(childKey, {
                    myKey: childKey,
                    filling: childJSX,
                    name: getModuleType(childKey),
                    inputOnly: inputOnly,
                });
                return newMap;
            });
        },
        [outputMode, handlePatchExit]
    );

    const handleClose = useCallback((childKey: string) => {
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
                if (
                    el.toData!.tomyKey === childKey ||
                    getBaseModuleId(el.toData!.tomyKey) === childKey
                ) {
                    toRemove.push(el);
                    el.fromData.audio.disconnect(el.toData!.audio as AudioNode);
                }
            });
            return prevCords.filter((el) => !toRemove.includes(el));
        });

        setCordCombos((prev) => {
            const newCombos = { ...prev };
            // Remove references to childKey from other modules' combo lists
            Object.keys(newCombos).forEach((key) => {
                if (Array.isArray(newCombos[key])) {
                    newCombos[key] = newCombos[key].filter((v) => v !== childKey);
                }
            });
            delete newCombos[childKey];
            return newCombos;
        });
    }, [nodeRefs]);

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
                        // remove last cord
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
                // Update cordCombos inside setPatchCords callback to access cord data
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
                } else if (
                    el.toData!.tomyKey.includes(' ') &&
                    getBaseModuleId(el.toData!.tomyKey) === modID
                ) {
                    el.toData!.toLocation = getCenterPoint(
                        document.getElementById(el.toData!.tomyKey + ' inputInner')!
                    );
                }
            });

            setPatchCords(newCords);
        },
        [patchCords]
    );

    const handleResize = useCallback(() => {
        setPatchCords((prevCords) => {
            const newCords = [...prevCords];
            newCords.forEach((el) => {
                el.fromData.fromLocation = getCenterPoint(
                    document.getElementById(el.fromData.fromModID + 'outputInner')!
                );
                el.toData!.toLocation = getCenterPoint(
                    document.getElementById(el.toData!.tomyKey + 'inputInner')!
                );
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
            <div id="header"></div>
            <div id="sidebar">
                <SideButtons id="sideButtons" handleClick={handleClick} audioIn={audioIn} />
            </div>
            <div id="playSpace">
                <svg id="patchCords" aria-label="Patch cord connections">{cords}</svg>
                <AlertBox message={pingText} onDismiss={handlePingExit} />
                <button
                    id="patchExit"
                    onClick={handlePatchExit}
                    aria-label="Cancel patch"
                    className={outputMode ? 'show iconBtn' : 'hide iconBtn'}
                ><i className="fa fa-times-circle" aria-hidden="true"></i></button>

                {[...list].map(([key, { myKey, filling, name, inputOnly }]) => {
                    const ref = getNodeRef(key);
                    return (
                        <Draggable
                            onDrag={() => {
                                handleDrag(key);
                            }}
                            key={key}
                            handle="p"
                            bounds="parent"
                            nodeRef={ref}
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
