import { useState, useCallback, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import Area from './components/Area';
import Cord from './components/Cord';
import Output from './components/Output';
import SideButtons from './components/SideButtons';
import { getModuleType, getBaseModuleId } from './utils/moduleId';
import { getCenterPoint } from './utils/centerPoint';

export default function App() {
    const [list, setList] = useState(new Map());
    const [patchCords, setPatchCords] = useState([]);
    const [currentCordCount, setCurrentCordCount] = useState(0);
    const [cumulativeCordCount, setCumulativeCordCount] = useState(0);
    const [outputMode, setOutputMode] = useState(false);
    const [cordCombos, setCordCombos] = useState({});
    const [alert, setAlert] = useState(false);
    const [pingText, setPingText] = useState('');
    const [audioIn, setAudioIn] = useState(false);
    const nodeRef = useRef(null);

    const handlePatchExit = useCallback(() => {
        setPatchCords((prev) => prev.slice(0, -1));
        setCurrentCordCount((c) => c - 1);
        setCumulativeCordCount((c) => c - 1);
        setOutputMode(false);
    }, []);

    const myAlert = useCallback((ping) => {
        setAlert(true);
        setPingText(ping);
    }, []);

    const handlePingExit = useCallback(() => {
        setAlert(false);
        setPingText('');
    }, []);

    const handleClick = useCallback(
        (childKey, childJSX, inputOnly) => {
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

    const handleClose = useCallback((childKey) => {
        setList((prev) => {
            const newMap = new Map(prev);
            newMap.delete(childKey);
            return newMap;
        });

        if (getModuleType(childKey) === 'AudioInput') {
            setAudioIn(false);
        }

        setPatchCords((prevCords) => {
            const toRemove = [];
            prevCords.forEach((el) => {
                if (el.fromData.fromModID === childKey) {
                    toRemove.push(el);
                    el.fromData.audio.disconnect(el.toData.audio);
                }
                if (
                    el.toData.tomyKey === childKey ||
                    getBaseModuleId(el.toData.tomyKey) === childKey
                ) {
                    toRemove.push(el);
                    el.fromData.audio.disconnect(el.toData.audio);
                }
            });
            return prevCords.filter((el) => !toRemove.includes(el));
        });

        setCurrentCordCount((c) => {
            // We need to calculate how many cords were removed; handled in setPatchCords
            return c; // Will be corrected below
        });

        // Use a combined update to handle cord count and combos correctly
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
    }, []);

    // Fix: recalculate currentCordCount when patchCords changes
    useEffect(() => {
        setCurrentCordCount(patchCords.length);
    }, [patchCords]);

    const addCord = useCallback(
        (info) => {
            setPatchCords((prev) => [...prev, { id: 'cord' + cumulativeCordCount, fromData: info, toData: null }]);
            setCurrentCordCount((c) => c + 1);
            setCumulativeCordCount((c) => c + 1);
            setOutputMode(true);
        },
        [cumulativeCordCount]
    );

    const handleOutput = useCallback(
        (info) => {
            if (outputMode) {
                const lastIdx = currentCordCount - 1;
                setPatchCords((prevCords) => {
                    const newCords = [...prevCords];
                    const lastEl = newCords[lastIdx];
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
                        lastEl.fromData.audio.connect(info.audio);
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
                setOutputMode(false);
            }
        },
        [outputMode, currentCordCount, cordCombos, myAlert]
    );

    const deleteCord = useCallback((cordID) => {
        setPatchCords((prevCords) => {
            for (let i = 0; i < prevCords.length; i++) {
                if (prevCords[i].id === cordID) {
                    prevCords[i].fromData.audio.disconnect(prevCords[i].toData.audio);
                    // Remove from cordCombos
                    const cordVal = prevCords[i];
                    const fromCombo = cordVal.fromData.fromModID;
                    setCordCombos((prev) => {
                        const newCombo = { ...prev };
                        if (newCombo[fromCombo]) {
                            newCombo[fromCombo] = newCombo[fromCombo].filter((v) => v !== cordVal.toData.tomyKey);
                        }
                        return newCombo;
                    });
                    break;
                }
            }
            return prevCords.filter((el) => el.id !== cordID);
        });
        setCurrentCordCount((c) => c - 1);
    }, []);

    const handleDrag = useCallback(
        (modID) => {
            const newCords = [...patchCords];
            newCords.forEach((el) => {
                if (el.fromData.fromModID === modID) {
                    el.fromData.fromLocation = getCenterPoint(document.getElementById(modID + 'outputInner'));
                } else if (el.toData.tomyKey === modID) {
                    el.toData.toLocation = getCenterPoint(document.getElementById(modID + 'inputInner'));
                } else if (
                    el.toData.tomyKey.includes(' ') &&
                    getBaseModuleId(el.toData.tomyKey) === modID
                ) {
                    el.toData.toLocation = getCenterPoint(
                        document.getElementById(el.toData.tomyKey + ' inputInner')
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
                    document.getElementById(el.fromData.fromModID + 'outputInner')
                );
                el.toData.toLocation = getCenterPoint(
                    document.getElementById(el.toData.tomyKey + 'inputInner')
                );
            });
            return newCords;
        });
    }, []);

    useEffect(() => {
        let rafId = null;
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

    const cords = [];
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
                    x2={el.toData.toLocation.x}
                    y2={el.toData.toLocation.y}
                ></Cord>
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
                <div className={alert ? 'show pingBox' : 'hide pingBox'}>
                    <div id="pingTextDiv">
                        <h3 className="error">Not so fast!</h3>
                    </div>
                    <p id="pingText">{pingText}</p>
                    <button id="pingExit" onClick={handlePingExit} aria-label="Dismiss alert" className="iconBtn"><i className="fa fa-times-circle" aria-hidden="true"></i></button>
                </div>
                <button
                    id="patchExit"
                    onClick={handlePatchExit}
                    aria-label="Cancel patch"
                    className={outputMode ? 'show iconBtn' : 'hide iconBtn'}
                ><i className="fa fa-times-circle" aria-hidden="true"></i></button>

                {[...list].map(([key, { myKey, filling, name, inputOnly }]) => {
                    return (
                        <Draggable
                            onDrag={() => {
                                handleDrag(key);
                            }}
                            key={key}
                            handle="p"
                            bounds="parent"
                            nodeRef={nodeRef}
                        >
                            <div className="dragDiv" ref={nodeRef}>
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
