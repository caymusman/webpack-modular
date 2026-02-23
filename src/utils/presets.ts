import { Preset, SerializedModule, SerializedConnection, ModuleRecord, PatchCord, MIDIMapping } from '../types';

const STORAGE_PREFIX = 'presets::';

export function serializePreset(
    name: string,
    list: Map<string, ModuleRecord>,
    patchCords: PatchCord[],
    midiMappings: MIDIMapping[] = []
): Preset {
    const modules: SerializedModule[] = [];
    list.forEach((mod) => {
        modules.push({
            key: mod.myKey,
            type: mod.name,
            inputOnly: mod.inputOnly,
            position: { x: mod.position.x, y: mod.position.y },
            params: mod.module.serialize(),
        });
    });

    const connections: SerializedConnection[] = [];
    patchCords.forEach((cord) => {
        if (cord.toData) {
            connections.push({
                fromModID: cord.fromData.fromModID,
                toModID: cord.toData.tomyKey,
            });
        }
    });

    const result: Preset = { name, modules, connections };
    if (midiMappings.length > 0) {
        result.midiMappings = { mappings: midiMappings };
    }
    return result;
}

export function deserializePreset(json: string): Preset | null {
    try {
        const parsed = JSON.parse(json);
        if (
            typeof parsed !== 'object' ||
            parsed === null ||
            typeof parsed.name !== 'string' ||
            !Array.isArray(parsed.modules) ||
            !Array.isArray(parsed.connections)
        ) {
            return null;
        }
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
            ) {
                return null;
            }
        }
        for (const conn of parsed.connections) {
            if (typeof conn.fromModID !== 'string' || typeof conn.toModID !== 'string') {
                return null;
            }
        }
        return parsed as Preset;
    } catch {
        return null;
    }
}

export function saveToLocalStorage(preset: Preset): void {
    localStorage.setItem(STORAGE_PREFIX + preset.name, JSON.stringify(preset));
}

export function loadFromLocalStorage(name: string): Preset | null {
    const raw = localStorage.getItem(STORAGE_PREFIX + name);
    if (!raw) return null;
    return deserializePreset(raw);
}

export function listPresets(): string[] {
    const names: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
            names.push(key.slice(STORAGE_PREFIX.length));
        }
    }
    return names.sort();
}

export function deletePreset(name: string): void {
    localStorage.removeItem(STORAGE_PREFIX + name);
}

export function exportPresetFile(preset: Preset): void {
    const json = JSON.stringify(preset, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = preset.name + '.json';
    a.click();
    URL.revokeObjectURL(url);
}

export function importPresetFile(file: File): Promise<Preset | null> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = deserializePreset(reader.result as string);
            resolve(result);
        };
        reader.onerror = () => resolve(null);
        reader.readAsText(file);
    });
}
