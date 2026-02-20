import { useSyncExternalStore } from 'react';
import { Param } from '../model/Param';

export function useParam<T>(param: Param<T>): [T, (v: T) => void] {
    const value = useSyncExternalStore(
        (cb) => param.subscribe(cb),
        () => param.value
    );
    // eslint-disable-next-line react-hooks/immutability
    return [
        value,
        (v: T) => {
            param.value = v;
        },
    ];
}
