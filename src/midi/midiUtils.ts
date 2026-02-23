/**
 * Convert a MIDI note number (0–127) to frequency in Hz.
 * A4 = note 69 = 440 Hz.
 */
export function midiNoteToHz(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
}

/**
 * Scale a MIDI CC value (0–127) to the given [min, max] range.
 */
export function scaleCCValue(cc: number, min: number, max: number): number {
    return min + (cc / 127) * (max - min);
}

/**
 * Build the midiLearnId string used as the unique key for a mappable control.
 * Format: "moduleKey::paramKey"
 */
export function makeMIDILearnId(moduleKey: string, paramKey: string): string {
    return `${moduleKey}::${paramKey}`;
}

/**
 * Parse a midiLearnId back into { moduleKey, paramKey }.
 */
export function parseMIDILearnId(id: string): { moduleKey: string; paramKey: string } {
    const sep = id.indexOf('::');
    if (sep === -1) return { moduleKey: id, paramKey: '' };
    return { moduleKey: id.slice(0, sep), paramKey: id.slice(sep + 2) };
}

/**
 * Build a stable map key for a MIDI CC mapping (channel + cc number).
 */
export function makeMIDIMappingKey(channel: number, cc: number): string {
    return `cc:${channel}:${cc}`;
}

/**
 * Build a stable map key for a MIDI note/gate mapping (channel).
 */
export function makeMIDINoteKey(channel: number): string {
    return `note:${channel}`;
}
