import { useSyncExternalStore } from 'react';
import { Param } from '../model/Param';

export function useParam<T>(param: Param<T>): [T, (v: T) => void] {
    const value = useSyncExternalStore(
        (cb) => param.subscribe(cb),
        () => param.value
    );
    return [
        value,
        (v: T) => {
            param.value = v; // eslint-disable-line react-hooks/immutability
        },
    ];
}
