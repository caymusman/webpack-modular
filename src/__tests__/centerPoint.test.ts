import { getCenterPoint, getCenterPointFromEvent } from '../utils/centerPoint';

describe('centerPoint utilities', () => {
    beforeEach(() => {
        // Set window dimensions for predictable results
        Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
    });

    describe('getCenterPoint', () => {
        test('calculates center from DOMRect-like object', () => {
            const rect = { x: 100, y: 200, right: 200, bottom: 300 };
            // largerDim = 1024, offset = 1024 * 0.04 = 40.96
            // xCenter = (200 - 100) / 2 + 100 - 40.96 = 109.04
            // yCenter = (300 - 200) / 2 + 200 - 40.96 = 209.04
            const result = getCenterPoint(rect);
            expect(result.x).toBeCloseTo(109.04);
            expect(result.y).toBeCloseTo(209.04);
        });

        test('uses larger dimension for offset', () => {
            Object.defineProperty(window, 'innerHeight', { value: 1200, writable: true });
            const rect = { x: 0, y: 0, right: 100, bottom: 100 };
            // largerDim = 1200, offset = 1200 * 0.04 = 48
            // xCenter = 50 - 48 = 2
            // yCenter = 50 - 48 = 2
            const result = getCenterPoint(rect);
            expect(result.x).toBeCloseTo(2);
            expect(result.y).toBeCloseTo(2);
        });

        test('accepts an Element and calls getBoundingClientRect', () => {
            const mockElement = {
                getBoundingClientRect: () => ({ x: 10, y: 20, right: 30, bottom: 40 }),
            };
            // Make it pass instanceof Element check
            Object.setPrototypeOf(mockElement, Element.prototype);
            const result = getCenterPoint(mockElement);
            // xCenter = (30-10)/2 + 10 - 40.96 = -20.96
            // yCenter = (40-20)/2 + 20 - 40.96 = -10.96
            expect(result.x).toBeCloseTo(-20.96);
            expect(result.y).toBeCloseTo(-10.96);
        });
    });

    describe('getCenterPointFromEvent', () => {
        test('extracts center from event target', () => {
            const mockEvent = {
                target: {
                    getBoundingClientRect: () => ({ x: 100, y: 200, right: 200, bottom: 300 }),
                },
            };
            Object.setPrototypeOf(mockEvent.target, Element.prototype);
            const result = getCenterPointFromEvent(mockEvent);
            expect(result.x).toBeCloseTo(109.04);
            expect(result.y).toBeCloseTo(209.04);
        });
    });
});
