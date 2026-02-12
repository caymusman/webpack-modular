import { Point } from '../types';

interface RectLike {
    x: number;
    y: number;
    right: number;
    bottom: number;
}

export function getCenterPoint(element: Element | RectLike): Point {
    const rect = element instanceof Element ? element.getBoundingClientRect() : element;
    const largerDim = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth;
    return {
        x: (rect.right - rect.x) / 2 + rect.x - largerDim * 0.04,
        y: (rect.bottom - rect.y) / 2 + rect.y - largerDim * 0.04,
    };
}

export function getCenterPointFromEvent(event: { target: EventTarget | null }): Point {
    return getCenterPoint(event.target as Element);
}
