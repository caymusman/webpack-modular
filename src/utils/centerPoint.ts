import { Point, CanvasTransform } from '../types';

interface RectLike {
    x: number;
    y: number;
    right: number;
    bottom: number;
}

export function getCenterPoint(element: Element | RectLike, transform?: CanvasTransform): Point {
    const rect = element instanceof Element ? element.getBoundingClientRect() : element;
    const rectCenterX = (rect.right - rect.x) / 2 + rect.x;
    const rectCenterY = (rect.bottom - rect.y) / 2 + rect.y;

    if (transform) {
        return {
            x: (rectCenterX - transform.playSpaceLeft - transform.panX) / transform.zoom,
            y: (rectCenterY - transform.playSpaceTop - transform.panY) / transform.zoom,
        };
    }

    const largerDim = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth;
    return {
        x: rectCenterX - largerDim * 0.04,
        y: rectCenterY - largerDim * 0.04,
    };
}

export function getCenterPointFromEvent(
    event: { target: EventTarget | null },
    transform?: CanvasTransform
): Point {
    return getCenterPoint(event.target as Element, transform);
}
