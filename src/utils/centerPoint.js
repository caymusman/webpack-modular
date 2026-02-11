export function getCenterPoint(element) {
    const rect = element instanceof Element ? element.getBoundingClientRect() : element;
    const largerDim = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth;
    return {
        x: (rect.right - rect.x) / 2 + rect.x - largerDim * 0.04,
        y: (rect.bottom - rect.y) / 2 + rect.y - largerDim * 0.04,
    };
}

export function getCenterPointFromEvent(event) {
    return getCenterPoint(event.target);
}
