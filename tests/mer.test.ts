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

        // Validate result doesn't intersect obstacles
        for (const s of obs) {
            expect(segmentIntersectsRectangle(s, res)).toBe(false);
        }
    });

    it('should find optimal area for U-Shape', () => {
        // U-Shape: Left, Bottom, Right walls opening Up
        // Bounds: 100x100
        // Left: (30,30)->(30,70)
        // Right: (70,30)->(70,70)
        // Bottom: (30,30)->(70,30)
        const obs: Segment[] = [
            new Segment({ x: 30, y: 30 }, { x: 30, y: 70 }),
            new Segment({ x: 70, y: 30 }, { x: 70, y: 70 }),
            new Segment({ x: 30, y: 30 }, { x: 70, y: 30 })
        ];

        // Expected MER candidates:
        // 1. Top half: (0, 70)-(100, 100) -> 100x30 = 3000
        // 2. Inside U? (30, 30)-(70, 70) ? No, interior is blocked?
        // Wait, if U is (30,30)-(30,70), (70,30)-(70,70), (30,30)-(70,30)
        // The "Inside" is open at top. 
        // Inside rectangle: x in (30, 70), y in (30, 70). Area 40x40 = 1600.
        // Side strips: Left of 30: 30x100 = 3000. Right of 70: 30x100 = 3000.
        // Bottom strip: Below 30: 100x30 = 3000.

        const res = solveSegments(obs, bounds);
        expect(rectArea(res)).toBeGreaterThanOrEqual(2999);
    });

    it('should find optimal area for Diamond Shape', () => {
        // Diamond centered at 50,50 radius 20
        // (50, 30), (70, 50), (50, 70), (30, 50)
        const obs: Segment[] = [
            new Segment({ x: 50, y: 30 }, { x: 70, y: 50 }),
            new Segment({ x: 70, y: 50 }, { x: 50, y: 70 }),
            new Segment({ x: 50, y: 70 }, { x: 30, y: 50 }),
            new Segment({ x: 30, y: 50 }, { x: 50, y: 30 })
        ];

        const res = solveSegments(obs, bounds);
        // Best rect likely outside.
        // Left/Right of 30/70: 30x100 = 3000.
        // Top/Bottom of 30/70: 100x30 = 3000.
        expect(rectArea(res)).toBeGreaterThanOrEqual(2999);
    });

    it('should handle Degenerate/Tiny obstacles', () => {
        // Very small segment
        const obs: Segment[] = [
            new Segment({ x: 50, y: 50 }, { x: 50.000001, y: 50.000001 })
        ];
        const res = solveSegments(obs, bounds);
        expect(rectArea(res)).toBeCloseTo(5000.0, 3);
    });

    it('should verify result validity for Random Fuzzy inputs', () => {
        // Reduced strictness for random test to avoid false positives on valid grazing touches
        for (let i = 0; i < 10; i++) {
            const obs: Segment[] = [];
            for (let j = 0; j < 5; j++) {
                const x = 10 + Math.random() * 80;
                const y = 10 + Math.random() * 80;
                // Random lengths and orientations
                obs.push(new Segment({ x, y }, { x: x + (Math.random() - 0.5) * 10, y: y + (Math.random() - 0.5) * 10 }));
            }

            const res = solveSegments(obs, bounds);

            expect(rectArea(res)).toBeGreaterThanOrEqual(0);
            expect(rectArea(res)).toBeLessThanOrEqual(10000);

            // Emptiness Check
            // We use standard intersection check but allow tiny tolerance?
            // segmentIntersectsRectangle already has EPS=1e-5.
            for (const s of obs) {
                const hit = segmentIntersectsRectangle(s, res);
                if (hit) {
                    // Log details if failure
                    // console.log("Fail case:", res, s);
                }
                expect(hit).toBe(false);
            }
        }
    });


    it('should handle Nearly Vertical segments robustly', () => {
        // Nearly vertical segment at x=50
        // (50, 0) -> (50.0000001, 100)
        // Should split space roughly in half. 50x100 = 5000 approx.
        const obs: Segment[] = [
            new Segment({ x: 50, y: 0 }, { x: 50.0000001, y: 100 })
        ];
        const res = solveSegments(obs, bounds);
        expect(rectArea(res)).toBeCloseTo(5000, 3);
        // Ensure not 10000
    });
    it('should find optimal area for U-Shape Opening Down', () => {
        // U-Shape: Left, Top, Right walls opening Down
        // Left: (30,30)->(30,70)
        // Right: (70,30)->(70,70)
        // Top: (30,70)->(70,70)
        const obs: Segment[] = [
            new Segment({ x: 30, y: 30 }, { x: 30, y: 70 }),
            new Segment({ x: 70, y: 30 }, { x: 70, y: 70 }),
            new Segment({ x: 30, y: 70 }, { x: 70, y: 70 })
        ];
        const res = solveSegments(obs, bounds);
        expect(rectArea(res)).toBeGreaterThanOrEqual(2999);
    });

    it('should find optimal area for U-Shape Opening Left', () => {
        // U-Shape: Top, Right, Bottom walls opening Left
        // Top: (30,70)->(70,70)
        // Bottom: (30,30)->(70,30)
        // Right: (70,30)->(70,70)
        const obs: Segment[] = [
            new Segment({ x: 30, y: 70 }, { x: 70, y: 70 }),
            new Segment({ x: 30, y: 30 }, { x: 70, y: 30 }),
            new Segment({ x: 70, y: 30 }, { x: 70, y: 70 })
        ];
        const res = solveSegments(obs, bounds);
        expect(rectArea(res)).toBeGreaterThanOrEqual(2999);
    });

    it('should find optimal area for U-Shape Opening Right', () => {
        // U-Shape: Top, Left, Bottom walls opening Right
        // Top: (30,70)->(70,70)
        // Bottom: (30,30)->(70,30)
        // Left: (30,30)->(30,70)
        const obs: Segment[] = [
            new Segment({ x: 30, y: 70 }, { x: 70, y: 70 }),
            new Segment({ x: 30, y: 30 }, { x: 70, y: 30 }),
            new Segment({ x: 30, y: 30 }, { x: 30, y: 70 })
        ];
        const res = solveSegments(obs, bounds);
        expect(rectArea(res)).toBeGreaterThanOrEqual(2999);
    });

    it('should find optimal area for Offset Cross', () => {
        // Unbalanced/Offset Cross
        // H: (20, 40) - (90, 40)  (Long, shifted up)
        // V: (30, 10) - (30, 90)  (Shifted left)
        const obs: Segment[] = [
            new Segment({ x: 20, y: 40 }, { x: 90, y: 40 }),
            new Segment({ x: 30, y: 10 }, { x: 30, y: 90 })
        ];
        const res = solveSegments(obs, bounds);

        // Expected regions:
        // Right of x=30: (30,0) -> (100,100) BUT blocked by H at y=40
        // - Top-Right: (30,40)-(100,100) -> 70x60 = 4200
        // - Bot-Right: (30,0)-(100,40) -> 70x40 = 2800
        // Left of x=30: (0,0)-(30,100) -> 30x100 = 3000

        expect(rectArea(res)).toBeGreaterThanOrEqual(4199);

        // Validation
        for (const s of obs) {
            expect(segmentIntersectsRectangle(s, res)).toBe(false);
        }
    });

    it('should find optimal area for Comb Shape (E-Shape)', () => {
        // Vertical spine at x=20
        // 3 Horizontal prongs at y=20, y=50, y=80 extending to x=80
        const obs: Segment[] = [
            new Segment({ x: 20, y: 10 }, { x: 20, y: 90 }), // Spine
            new Segment({ x: 20, y: 20 }, { x: 80, y: 20 }), // Prong 1
            new Segment({ x: 20, y: 50 }, { x: 80, y: 50 }), // Prong 2
            new Segment({ x: 20, y: 80 }, { x: 80, y: 80 })  // Prong 3
        ];

        const res = solveSegments(obs, bounds);

        // Candidates:
        // Left strip: 0-20 -> 20x100 = 2000
        // Right strip: 80-100 -> 20x100 = 2000
        // Top/Bot strips: 0-20/80-100 height -> 100x20 = 2000
        // Internal pockets: 
        // - Between y=20 and y=50, x from 20 to 100? No, open to right.
        // - Rect (20, 20) -> (100, 50) ? Area 80x30 = 2400.
        // - Rect (20, 50) -> (100, 80) ? Area 80x30 = 2400.

        expect(rectArea(res)).toBeGreaterThanOrEqual(2399);
        for (const s of obs) {
            expect(segmentIntersectsRectangle(s, res)).toBe(false);
        }
    });
});
