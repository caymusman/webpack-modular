import { cablePath } from '../components/Cord';

// Helper: parse the Q control point from a path string like "M x1,y1 Q cpx,cpy x2,y2"
function parseControlPoint(d: string): { cpx: number; cpy: number } {
    const match = d.match(/Q ([\d.eE+-]+),([\d.eE+-]+)/);
    if (!match) throw new Error(`No Q control point found in: ${d}`);
    return { cpx: Number(match[1]), cpy: Number(match[2]) };
}

describe('cablePath', () => {
    test('returns a string starting with M and containing Q', () => {
        const d = cablePath(0, 0, 100, 0);
        expect(typeof d).toBe('string');
        expect(d.startsWith('M ')).toBe(true);
        expect(d).toContain(' Q ');
    });

    test('path starts at (x1, y1)', () => {
        expect(cablePath(10, 20, 300, 400)).toMatch(/^M 10,20 /);
        expect(cablePath(0, 0, 100, 100)).toMatch(/^M 0,0 /);
    });

    test('path ends at (x2, y2)', () => {
        expect(cablePath(0, 0, 300, 400)).toMatch(/ 300,400$/);
        expect(cablePath(10, 20, 50, 60)).toMatch(/ 50,60$/);
    });

    test('control point x is the horizontal midpoint of x1 and x2', () => {
        const { cpx } = parseControlPoint(cablePath(0, 0, 200, 0));
        expect(cpx).toBe(100);

        const { cpx: cpx2 } = parseControlPoint(cablePath(100, 0, 300, 0));
        expect(cpx2).toBe(200);
    });

    test('control point y is below the chord midpoint (positive droop)', () => {
        // Horizontal cord at y=0: midY=0, control point must be > 0
        const { cpy } = parseControlPoint(cablePath(0, 0, 200, 0));
        const midY = (0 + 0) / 2;
        expect(cpy).toBeGreaterThan(midY);
    });

    test('minimum droop is 60px for very short cords', () => {
        // dist = 10, dist * 0.5 = 5 < 60 → clamped to 60
        const { cpy } = parseControlPoint(cablePath(0, 0, 10, 0));
        expect(cpy).toBeGreaterThanOrEqual(60);
    });

    test('droop scales with distance beyond the minimum', () => {
        const { cpy: shortCpy } = parseControlPoint(cablePath(0, 0, 50, 0));
        const { cpy: longCpy } = parseControlPoint(cablePath(0, 0, 500, 0));
        expect(longCpy).toBeGreaterThan(shortCpy);
    });

    test('produces correct path for a known horizontal cord', () => {
        // dist = 200, droop = max(60, 100) = 100, cpx = 100, cpy = 0 + 100 = 100
        expect(cablePath(0, 0, 200, 0)).toBe('M 0,0 Q 100,100 200,0');
    });

    test('droops correctly for vertical cords (regression: old cubic formula was a straight line)', () => {
        // x1 === x2 — the old cubic bezier C x1,cy1 x2,cy2 x2,y2 with cx=x meant
        // all x-coords were equal → rendered as a straight vertical line.
        // The quadratic bezier Q (midX, midY+droop) always has cpY > midY.
        const d = cablePath(100, 0, 100, 200);
        const { cpy } = parseControlPoint(d);
        const midY = (0 + 200) / 2; // 100
        expect(cpy).toBeGreaterThan(midY);
    });

    test('handles zero-length cord without NaN or Infinity', () => {
        const d = cablePath(0, 0, 0, 0);
        expect(d).not.toContain('NaN');
        expect(d).not.toContain('Infinity');
        // droop should clamp to minimum 60
        const { cpy } = parseControlPoint(d);
        expect(cpy).toBeGreaterThanOrEqual(60);
    });

    test('handles diagonal cords correctly', () => {
        // dist = sqrt(200^2 + 200^2) ≈ 282.8, droop = max(60, 141.4) = 141.4
        const d = cablePath(0, 0, 200, 200);
        const { cpx, cpy } = parseControlPoint(d);
        expect(cpx).toBe(100); // midX
        const midY = (0 + 200) / 2; // 100
        expect(cpy).toBeGreaterThan(midY); // droops below midpoint
    });

    test('control point y never goes above the chord midpoint', () => {
        // Droop is always positive — control point always below midY
        const cases: [number, number, number, number][] = [
            [0, 0, 100, 0],
            [0, 0, 0, 100],
            [50, 100, 200, 50],
            [0, 500, 300, 100],
        ];
        for (const [x1, y1, x2, y2] of cases) {
            const { cpy } = parseControlPoint(cablePath(x1, y1, x2, y2));
            const midY = (y1 + y2) / 2;
            expect(cpy).toBeGreaterThanOrEqual(midY);
        }
    });
});
