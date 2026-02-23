import { useEffect, useRef, useCallback } from 'react';
import { ModuleRecord, MIDIMapping } from '../types';
import { useMIDI } from './MIDIProvider';
import { useMIDILearn } from './MIDILearnContext';
import { midiNoteToHz, scaleCCValue, makeMIDIMappingKey, makeMIDINoteKey } from './midiUtils';
import { NumericParam } from '../model/Param';
import type { ADSRModule } from '../model/modules/ADSRModule';

export function useMIDIPlayback(list: Map<string, ModuleRecord>): void {
    const { addHandler, removeHandler } = useMIDI();
    const { serializeMappings, learnMode } = useMIDILearn();

    // Keep a stable ref to the live mappings so the handler closure doesn't go stale
    const mappingsRef = useRef<MIDIMapping[]>([]);
    const listRef = useRef(list);
    const learnModeRef = useRef(learnMode);

    useEffect(() => {
        listRef.current = list;
    }, [list]);

    useEffect(() => {
        learnModeRef.current = learnMode;
    }, [learnMode]);

    // Re-read mappings whenever learn mode exits (mappings may have been added)
    useEffect(() => {
        if (!learnMode) {
            mappingsRef.current = serializeMappings();
        }
    }, [learnMode, serializeMappings]);

    // Also update when serializeMappings reference changes (i.e. mappings state changed)
    useEffect(() => {
        mappingsRef.current = serializeMappings();
    }, [serializeMappings]);

    const playbackHandler = useCallback((event: MIDIMessageEvent) => {
        // Never apply playback while in learn mode — the learn handler takes over
        if (learnModeRef.current) return;

        const data = event.data;
        if (!data || data.length < 2) return;

        const status = data[0];
        const channel = status & 0x0f;
        const type = status & 0xf0;
        const currentList = listRef.current;

        if (type === 0xb0 && data.length >= 3) {
            // CC message
            const cc = data[1];
            const ccValue = data[2];
            const key = makeMIDIMappingKey(channel, cc);

            for (const mapping of mappingsRef.current) {
                if (mapping.kind !== 'cc') continue;
                if (makeMIDIMappingKey(mapping.channel, mapping.cc) !== key) continue;

                const record = currentList.get(mapping.moduleKey);
                if (!record) continue;
                const param = record.module.params[mapping.paramKey];
                if (!param || !(param instanceof NumericParam)) continue;

                const scaled = scaleCCValue(ccValue, mapping.min, mapping.max);
                param.value = scaled;
            }
        } else if (type === 0x90 && data.length >= 3 && data[2] > 0) {
            // Note-on
            const note = data[1];
            const noteKey = makeMIDINoteKey(channel);

            for (const mapping of mappingsRef.current) {
                if (mapping.kind === 'note') {
                    if (makeMIDINoteKey(mapping.channel) !== noteKey) continue;
                    const record = currentList.get(mapping.moduleKey);
                    if (!record) continue;
                    const param = record.module.params['frequency'];
                    if (!param || !(param instanceof NumericParam)) continue;
                    param.value = midiNoteToHz(note);
                } else if (mapping.kind === 'gate') {
                    if (mapping.channel !== channel) continue;
                    const record = currentList.get(mapping.moduleKey);
                    if (!record) continue;
                    (record.module as ADSRModule).triggerAttack();
                }
            }
        } else if (type === 0x80 || (type === 0x90 && data.length >= 3 && data[2] === 0)) {
            // Note-off
            for (const mapping of mappingsRef.current) {
                if (mapping.kind !== 'gate') continue;
                if (mapping.channel !== channel) continue;
                const record = currentList.get(mapping.moduleKey);
                if (!record) continue;
                (record.module as ADSRModule).triggerRelease();
            }
        }
    }, []);

    useEffect(() => {
        addHandler(playbackHandler);
        return () => removeHandler(playbackHandler);
    }, [addHandler, removeHandler, playbackHandler]);
}
