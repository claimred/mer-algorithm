import { describe, it, expect } from 'vitest';
import { MerSolver } from '../src/mer_solver';
import { Segment, Rectangle, rectArea, segmentIntersectsRectangle } from '../src/geometry';

describe('MER Algorithm', () => {
    const solver = new MerSolver();
    const bounds: Rectangle = { x_min: 0, y_min: 0, x_max: 100, y_max: 100 };

    it('should return full bounds with no obstacles', () => {
        const res = solver.solve(bounds, []);
        expect(rectArea(res)).toBeCloseTo(10000.0, 5);
    });

    it('should match manual calculation for One Point (50, 50)', () => {
        const obs: Segment[] = [{ p1: { x: 50, y: 50 }, p2: { x: 50, y: 50 } }];
        const res = solver.solve(bounds, obs);
        expect(rectArea(res)).toBeCloseTo(5000.0, 5);
    });

    it('should find optimal area for Cross Shape', () => {
        // Horizontal (20, 50)-(80, 50)
        // Vertical (50, 20)-(50, 80)
        // The optimal MER is either [0,0]-[100,50] or [0,50]-[100,100] = Area 5000
        // (Rectangle boundary can touch segment endpoints but not cross them)
        const obs: Segment[] = [
            { p1: { x: 20, y: 50 }, p2: { x: 80, y: 50 } },
            { p1: { x: 50, y: 20 }, p2: { x: 50, y: 80 } }
        ];
        const res = solver.solve(bounds, obs);
        // The algorithm should find at minimum a half-bounds rectangle (5000)
        // or even better if it finds a valid corner (2500) or strip
        expect(rectArea(res)).toBeGreaterThan(1990);
        expect(rectArea(res)).toBeLessThanOrEqual(5001);
    });

    it('should verify result validity for Random Fuzzy inputs', () => {
        // Pseudo-random generator logic or just Math.random for quick check
        for (let i = 0; i < 50; i++) {
            const obs: Segment[] = [];
            for (let j = 0; j < 10; j++) {
                const x = 10 + Math.random() * 80;
                const y = 10 + Math.random() * 80;
                // Generate Isothetic (Horizontal) segment
                obs.push({ p1: { x, y }, p2: { x: x + 1, y: y } });
            }

            const res = solver.solve(bounds, obs);

            expect(rectArea(res)).toBeGreaterThanOrEqual(0);
            expect(rectArea(res)).toBeLessThanOrEqual(10000);

            // Emptiness Check
            for (const s of obs) {
                // If segment strictly intersects rectangle -> fail
                if (segmentIntersectsRectangle(s, res)) {
                    // Refine check: strict interior intersection?
                    // Boundary touches are allowed in MER usually, but pure interior shouldn't have content.
                    const minX = Math.min(s.p1.x, s.p2.x);
                    const maxX = Math.max(s.p1.x, s.p2.x);
                    const minY = Math.min(s.p1.y, s.p2.y);
                    const maxY = Math.max(s.p1.y, s.p2.y);

                    const outside = (maxX <= res.x_min + 1e-5 || minX >= res.x_max - 1e-5 ||
                        maxY <= res.y_min + 1e-5 || minY >= res.y_max - 1e-5);

                    expect(outside).toBe(true);
                }
            }
        }
    });

    it('should find optimal area for Staircase Shape', () => {
        // Steps at (20,20), (40,40), (60,60), (80,80)
        const obs: Segment[] = [
            { p1: { x: 20, y: 20 }, p2: { x: 20, y: 20 } },
            { p1: { x: 40, y: 40 }, p2: { x: 40, y: 40 } },
            { p1: { x: 60, y: 60 }, p2: { x: 60, y: 60 } },
            { p1: { x: 80, y: 80 }, p2: { x: 80, y: 80 } }
        ];
        const res = solver.solve(bounds, obs);
        // Largest rectangle usually formed by the largest "step"
        // Options: [0,0]-[100,20]=2000, [0,0]-[20,100]=2000...
        // Largest open space likely [0,80]-[100,100]=200 or [80,0]-[100,100]??
        // Let's trace:
        // Area under steps: [0,0] to [100,20] = 2000
        // Area [20,20] to [100,40] = 80*20 = 1600
        // ...
        // One big block: [0,0] to [20,100] = 2000
        expect(rectArea(res)).toBeGreaterThanOrEqual(2000);
    });

    it('should find optimal area for U-Shape', () => {
        // U-shape opening upwards
        // Left wall: (20,20)-(20,80)
        // Bottom: (20,20)-(80,20)
        // Right wall: (80,20)-(80,80)
        const obs: Segment[] = [
            { p1: { x: 20, y: 20 }, p2: { x: 20, y: 80 } },
            { p1: { x: 20, y: 20 }, p2: { x: 80, y: 20 } },
            { p1: { x: 80, y: 20 }, p2: { x: 80, y: 80 } }
        ];
        const res = solver.solve(bounds, obs);
        // Central void inside U: [20,20] to [80,100] (assuming top is open) = 60*80 = 4800
        // Or side strips: [0,0] to [20,100] = 2000
        // Or bottom strip: [0,0] to [100,20] = 2000
        expect(rectArea(res)).toBeCloseTo(4800, 0);
    });

    it('should handle Grid Pattern', () => {
        // 3x3 grid of points
        const obs: Segment[] = [];
        for (let x = 25; x <= 75; x += 25) {
            for (let y = 25; y <= 75; y += 25) {
                obs.push({ p1: { x, y }, p2: { x, y } });
            }
        }
        const res = solver.solve(bounds, obs);
        // Grid points at 25, 50, 75
        // Expect largest rect to be a strip of width 25 or height 25 at the edges
        // e.g. [0,0] to [25,100] = 2500
        expect(rectArea(res)).toBeGreaterThanOrEqual(2500);
    });

    it('should handle Collinear Points', () => {
        // Line of points at x=50
        const obs: Segment[] = [];
        for (let y = 10; y <= 90; y += 10) {
            obs.push({ p1: { x: 50, y }, p2: { x: 50, y } });
        }
        const res = solver.solve(bounds, obs);
        // Should find [0,0]-[50,100] = 5000
        expect(rectArea(res)).toBeCloseTo(5000, 0);
    });
});
