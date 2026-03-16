import { memo, useState, useCallback, useLayoutEffect } from 'react';
import type { ModuleGroup, ModuleRecord } from '../types';

interface GroupBoxProps {
    group: ModuleGroup;
    list: Map<string, ModuleRecord>; // used as change-trigger for useLayoutEffect
    nodeRefs: Map<string, React.RefObject<HTMLDivElement>>;
    zoom: number;
    onSelectAll: () => void;
    onRename: (id: string, name: string) => void;
    onDissolve: (id: string) => void;
    onDelete: (id: string) => void;
    onOrganize: (id: string) => void;
    onSaveAsInstrument: (id: string) => void;
}

/**
 * Read bounds from the DOM after commit so we measure the actual .moduleDiv
 * (the visible panel) rather than the dragDiv anchor (which is 12.5vw × 10.5vh
 * and may be much smaller than the module's content area).
 * All coordinates are converted to canvas-space pixels by dividing by zoom.
 */
function computeBounds(
    group: ModuleGroup,
    nodeRefs: Map<string, React.RefObject<HTMLDivElement>>,
    zoom: number
): { left: number; top: number; width: number; height: number } | null {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasAny = false;
    let canvasRect: DOMRect | null = null;

    for (const key of group.moduleKeys) {
        const ref = nodeRefs.get(key);
        if (!ref?.current) continue;

        // Locate canvas once — it's the transformed ancestor that defines canvas-space coords
        if (!canvasRect) {
            const canvasEl = ref.current.closest('#canvas');
            canvasRect = canvasEl?.getBoundingClientRect() ?? null;
        }
        if (!canvasRect) continue;

        // Prefer .moduleDiv for the actual visible panel; fall back to the dragDiv
        const el = (ref.current.querySelector('.moduleDiv') as HTMLElement | null) ?? ref.current;
        const rect = el.getBoundingClientRect();

        const modLeft = (rect.left - canvasRect.left) / zoom;
        const modTop  = (rect.top  - canvasRect.top)  / zoom;
        const modW    = rect.width  / zoom;
        const modH    = rect.height / zoom;

        minX = Math.min(minX, modLeft);
        minY = Math.min(minY, modTop);
        maxX = Math.max(maxX, modLeft + modW);
        maxY = Math.max(maxY, modTop  + modH);
        hasAny = true;
    }

    if (!hasAny) return null;

    return {
        left:   minX - 20,
        top:    minY - 20,
        width:  maxX - minX + 40,
        height: maxY - minY + 40,
    };
}

function GroupBox({ group, list, nodeRefs, zoom, onSelectAll, onRename, onDissolve, onDelete, onOrganize, onSaveAsInstrument }: GroupBoxProps) {
    const [renaming, setRenaming] = useState(false);
    const [draftName, setDraftName] = useState(group.name);

    // Recompute bounds after every DOM commit so we read freshly-painted positions.
    // `list` is in deps purely as a trigger — any position change re-runs the effect.
    // `nodeRefs` is a stable Map instance (identity never changes), safe to omit.
    const [bounds, setBounds] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
    /* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
    useLayoutEffect(() => {
        setBounds(computeBounds(group, nodeRefs, zoom));
    }, [group, list, zoom]);
    /* eslint-enable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */

    const commitRename = useCallback(() => {
        setRenaming(false);
        const trimmed = draftName.trim();
        if (trimmed && trimmed !== group.name) {
            onRename(group.id, trimmed);
        } else {
            setDraftName(group.name);
        }
    }, [draftName, group.id, group.name, onRename]);

    if (!bounds) return null;

    return (
        <div
            className="groupBox"
            style={{
                position: 'absolute',
                left: bounds.left,
                top: bounds.top,
                width: bounds.width,
                height: bounds.height,
            }}
            onMouseDown={(e) => {
                e.stopPropagation();
                onSelectAll();
            }}
        >
            <div className="groupBox__header">
                {renaming ? (
                    <input
                        className="groupBox__input"
                        autoFocus
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename();
                            if (e.key === 'Escape') {
                                setDraftName(group.name);
                                setRenaming(false);
                            }
                        }}
                        aria-label="Rename group"
                    />
                ) : (
                    <span
                        className="groupBox__label"
                        onDoubleClick={() => {
                            setDraftName(group.name);
                            setRenaming(true);
                        }}
                        title="Double-click to rename"
                    >
                        {group.name}
                    </span>
                )}
                <div className="groupBox__actions">
                    <button
                        className="groupBox__btn"
                        aria-label={`Save ${group.name} as instrument`}
                        title="Save as instrument"
                        onClick={(e) => { e.stopPropagation(); onSaveAsInstrument(group.id); }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <i className="fa fa-floppy-o" aria-hidden="true" />
                    </button>
                    <button
                        className="groupBox__btn"
                        aria-label={`Organize ${group.name}`}
                        title="Organize layout"
                        onClick={(e) => { e.stopPropagation(); onOrganize(group.id); }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <i className="fa fa-th" aria-hidden="true" />
                    </button>
                    <button
                        className="groupBox__btn"
                        aria-label={`Dissolve ${group.name}`}
                        title="Dissolve group"
                        onClick={(e) => { e.stopPropagation(); onDissolve(group.id); }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <i className="fa fa-expand" aria-hidden="true" />
                    </button>
                    <button
                        className="groupBox__btn groupBox__btn--delete"
                        aria-label={`Delete ${group.name} and all modules`}
                        title="Delete group and all modules"
                        onClick={(e) => { e.stopPropagation(); onDelete(group.id); }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <i className="fa fa-times" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default memo(GroupBox);
