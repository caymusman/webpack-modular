import { useState, useCallback, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import Area from './components/Area';
import Cord from './components/Cord';
import Output from './components/Output';
import SideButtons from './components/SideButtons';

export default function App() {
    const [list, setList] = useState(new Map());
    const [patchCords, setPatchCords] = useState([]);
    const [currentCordCount, setCurrentCordCount] = useState(0);
    const [cumulativeCordCount, setCumulativeCordCount] = useState(0);
    const [outputMode, setOutputMode] = useState(false);
    const [cordCombos, setCordCombos] = useState({});
    const [alert, setAlert] = useState(false);
    const [pingText, setPingText] = useState('');
    const [audioContext] = useState(() => new AudioContext());
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
            if (childKey.split(' ')[0] === 'AudioInput') {
                setAudioIn(true);
            }
            setCordCombos((prev) => ({ ...prev, [childKey]: [] }));
            setList((prev) => {
                const newMap = new Map(prev);
                newMap.set(childKey, {
                    myKey: childKey,
                    filling: childJSX,
                    name: childKey.split(' ')[0],
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

        if (childKey.split(' ')[0] === 'AudioInput') {
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
                    el.toData.tomyKey.split(' ')[0] + ' ' + el.toData.tomyKey.split(' ')[1] === childKey
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
            const largerDim = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth;
            const newCords = [...patchCords];
            newCords.forEach((el) => {
                if (el.fromData.fromModID === modID) {
                    const in_el = document.getElementById(modID + 'outputInner').getBoundingClientRect();
                    const in_x = in_el.x;
                    const in_y = in_el.y;
                    const in_bottom = in_el.bottom;
                    const in_right = in_el.right;
                    const in_xCenter = (in_right - in_x) / 2 + in_x - largerDim * 0.04;
                    const in_yCenter = (in_bottom - in_y) / 2 + in_y - largerDim * 0.04;
                    el.fromData.fromLocation = { x: in_xCenter, y: in_yCenter };
                } else if (el.toData.tomyKey === modID) {
                    const to_el = document.getElementById(modID + 'inputInner').getBoundingClientRect();
                    const to_x = to_el.x;
                    const to_y = to_el.y;
                    const to_bottom = to_el.bottom;
                    const to_right = to_el.right;
                    const to_xCenter = (to_right - to_x) / 2 + to_x - largerDim * 0.04;
                    const to_yCenter = (to_bottom - to_y) / 2 + to_y - largerDim * 0.04;
                    el.toData.toLocation = { x: to_xCenter, y: to_yCenter };
                } else if (
                    el.toData.tomyKey.includes(' ') &&
                    el.toData.tomyKey.split(' ')[0] + ' ' + el.toData.tomyKey.split(' ')[1] === modID
                ) {
                    const to_el = document.getElementById(el.toData.tomyKey + ' inputInner').getBoundingClientRect();
                    const to_x = to_el.x;
                    const to_y = to_el.y;
                    const to_bottom = to_el.bottom;
                    const to_right = to_el.right;
                    const to_xCenter = (to_right - to_x) / 2 + to_x - largerDim * 0.04;
                    const to_yCenter = (to_bottom - to_y) / 2 + to_y - largerDim * 0.04;
                    el.toData.toLocation = { x: to_xCenter, y: to_yCenter };
                }
            });

            setPatchCords(newCords);
        },
        [patchCords]
    );

    const handleResize = useCallback(() => {
        const largerDim = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth;
        setPatchCords((prevCords) => {
            const newCords = [...prevCords];
            newCords.forEach((el) => {
                const fromID = el.fromData.fromModID;
                const in_el = document.getElementById(fromID + 'outputInner').getBoundingClientRect();
                const in_xCenter = (in_el.right - in_el.x) / 2 + in_el.x - largerDim * 0.04;
                const in_yCenter = (in_el.bottom - in_el.y) / 2 + in_el.y - largerDim * 0.04;
                el.fromData.fromLocation = { x: in_xCenter, y: in_yCenter };

                const toID = el.toData.tomyKey;
                const out_el = document.getElementById(toID + 'inputInner').getBoundingClientRect();
                const out_xCenter = (out_el.right - out_el.x) / 2 + out_el.x - largerDim * 0.04;
                const out_yCenter = (out_el.bottom - out_el.y) / 2 + out_el.y - largerDim * 0.04;
                el.toData.toLocation = { x: out_xCenter, y: out_yCenter };
            });
            return newCords;
        });
    }, []);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
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
                <svg id="patchCords">{cords}</svg>
                <div className={alert ? 'show pingBox' : 'hide pingBox'}>
                    <div id="pingTextDiv">
                        <h3 className="error">Not so fast!</h3>
                    </div>
                    <p id="pingText">{pingText}</p>
                    <i id="pingExit" onClick={handlePingExit} className="fa fa-times-circle" aria-hidden="true"></i>
                </div>
                <i
                    id="patchExit"
                    onClick={handlePatchExit}
                    className={outputMode ? 'show fa fa-times-circle' : 'hide fa fa-times-circle'}
                    aria-hidden="true"
                ></i>

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
                                    audioContext={audioContext}
                                    alert={myAlert}
                                />
                            </div>
                        </Draggable>
                    );
                })}
                <Output handleOutput={handleOutput} audioContext={audioContext} />
            </div>
        </div>
    );
}
