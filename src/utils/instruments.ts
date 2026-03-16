import { Instrument, SerializedConnection, ModuleRecord, PatchCord, ModuleGroup } from '../types';

const STORAGE_PREFIX = 'instruments::';

function toModIDBelongsToGroup(toModID: string, moduleKeySet: Set<string>): boolean {
    for (const key of moduleKeySet) {
        if (toModID === key || toModID.startsWith(key + ' ') || toModID.startsWith(key + '|')) {
            return true;
        }
    }
    return false;
}

export function serializeInstrument(
    groupId: string,
    list: Map<string, ModuleRecord>,
    patchCords: PatchCord[],
    groups: Map<string, ModuleGroup>
): Instrument | null {
    const group = groups.get(groupId);
    if (!group) return null;

    const moduleKeySet = new Set(group.moduleKeys);

    const modules = group.moduleKeys
        .filter((key) => list.has(key))
        .map((key) => {
            const mod = list.get(key)!;
            return {
                key: mod.myKey,
                type: mod.filling,
                inputOnly: mod.inputOnly,
                position: { x: mod.position.x, y: mod.position.y },
                params: mod.module.serialize(),
                ...(mod.name !== mod.filling && { displayName: mod.name }),
            };
        });

    // Normalize positions so the top-left module is at (0, 0)
    if (modules.length > 0) {
        const minX = Math.min(...modules.map((m) => m.position.x));
        const minY = Math.min(...modules.map((m) => m.position.y));
        modules.forEach((m) => {
            m.position.x -= minX;
            m.position.y -= minY;
        });
    }

    // Only include connections where both endpoints belong to this group
    const connections: SerializedConnection[] = [];
    patchCords.forEach((cord) => {
        if (!cord.toData) return;
        const fromModKey = cord.fromData.fromModID;
        const toModID = cord.toData.tomyKey;
        if (moduleKeySet.has(fromModKey) && toModIDBelongsToGroup(toModID, moduleKeySet)) {
            connections.push({ fromModID: fromModKey, toModID });
        }
    });

    return { name: group.name, modules, connections };
}

export function deserializeInstrument(json: string): Instrument | null {
    try {
        const parsed = JSON.parse(json);
        if (
            typeof parsed !== 'object' ||
            parsed === null ||
            typeof parsed.name !== 'string' ||
            !Array.isArray(parsed.modules) ||
            !Array.isArray(parsed.connections)
        ) return null;
        for (const mod of parsed.modules) {
            if (
                typeof mod.key !== 'string' ||
                typeof mod.type !== 'string' ||
                typeof mod.inputOnly !== 'boolean' ||
                typeof mod.position !== 'object' ||
                mod.position === null ||
                typeof mod.position.x !== 'number' ||
                typeof mod.position.y !== 'number' ||
                typeof mod.params !== 'object' ||
                mod.params === null
            ) return null;
        }
        for (const conn of parsed.connections) {
            if (typeof conn.fromModID !== 'string' || typeof conn.toModID !== 'string') return null;
        }
        return parsed as Instrument;
    } catch {
        return null;
    }
}

export function saveInstrument(instrument: Instrument): void {
    localStorage.setItem(STORAGE_PREFIX + instrument.name, JSON.stringify(instrument));
}

export function loadInstrument(name: string): Instrument | null {
    const raw = localStorage.getItem(STORAGE_PREFIX + name);
    if (!raw) return null;
    return deserializeInstrument(raw);
}

export function listInstruments(): string[] {
    const names: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
            names.push(key.slice(STORAGE_PREFIX.length));
        }
    }
    return names.sort();
}

export function deleteInstrument(name: string): void {
    localStorage.removeItem(STORAGE_PREFIX + name);
}

export function exportInstrumentFile(instrument: Instrument): void {
    const json = JSON.stringify(instrument, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = instrument.name + '.instrument.json';
    a.click();
    URL.revokeObjectURL(url);
}

export function importInstrumentFile(file: File): Promise<Instrument | null> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(deserializeInstrument(reader.result as string));
        };
        reader.onerror = () => resolve(null);
        reader.readAsText(file);
    });
}
