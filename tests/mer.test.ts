import { describe, it, expect } from 'vitest';
import { solveSegments } from '../src/mer_solver';
import { Segment, Rectangle, rectArea, segmentIntersectsRectangle } from '../src/geometry';

describe('MER Algorithm', () => {
    // Standard 100x100 bounds
    const bounds: Rectangle = { x: 0, y: 0, width: 100, height: 100 };

    it('should return full bounds with no obstacles', () => {
        const res = solveSegments([], bounds);
        expect(rectArea(res)).toBeCloseTo(10000.0, 5);
    });

    it('should match manual calculation for One Point (50, 50)', () => {
        const obs: Segment[] = [new Segment({ x: 50, y: 50 }, { x: 50, y: 50 })];
        const res = solveSegments(obs, bounds);
        // Point obstacle splits 100x100. Best rect is 50x100 or 100x50.
        expect(rectArea(res)).toBeCloseTo(5000.0, 5);
    });

    it('should find optimal area for Cross Shape', () => {
        // Horizontal (20, 50)-(80, 50)
        // Vertical (50, 20)-(50, 80)
        const obs: Segment[] = [
            new Segment({ x: 20, y: 50 }, { x: 80, y: 50 }),
            new Segment({ x: 50, y: 20 }, { x: 50, y: 80 })
        ];
        const res = solveSegments(obs, bounds);
        // Half-space is 100x50 = 5000 approx.
        expect(rectArea(res)).toBeGreaterThan(1990);
        expect(rectArea(res)).toBeLessThanOrEqual(5001);
    });

    /*
    it('should verify result validity for Random Fuzzy inputs', () => {
        for (let i = 0; i < 20; i++) {
            const obs: Segment[] = [];
            for (let j = 0; j < 5; j++) {
                const x = 10 + Math.random() * 80;
                const y = 10 + Math.random() * 80;
                obs.push(new Segment({ x, y }, { x: x + 1, y: y }));
            }

            const res = solveSegments(obs, bounds);

            expect(rectArea(res)).toBeGreaterThanOrEqual(0);
            expect(rectArea(res)).toBeLessThanOrEqual(10000);

            // Emptiness Check
            for (const s of obs) {
                // Check that the interior of MER does NOT intersect the segment
                const hit = segmentIntersectsRectangle(s, res);
                expect(hit).toBe(false);
            }
        }
    });
    */
});
