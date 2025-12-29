import { MerSolver } from '@src/mer_solver';
import { Segment, Rectangle } from '@src/geometry';

export class State {
    public obstacles: Segment[] = [];
    public bounds: Rectangle = { x_min: 0, y_min: 0, x_max: 100, y_max: 100 };
    public result: Rectangle | null = null;
    public solver: MerSolver;

    constructor() {
        this.solver = new MerSolver();
    }

    addObstacle(s: Segment) {
        this.obstacles.push(s);
        this.result = null; // Invalidate result
    }

    setObstacles(obs: Segment[]) {
        this.obstacles = obs;
        this.result = null;
    }

    clear() {
        this.obstacles = [];
        this.result = null;
    }

    solve() {
        const t0 = performance.now();
        this.result = this.solver.solve(this.bounds, this.obstacles);
        const t1 = performance.now();
        return {
            time: t1 - t0,
            area: this.result ? (this.result.x_max - this.result.x_min) * (this.result.y_max - this.result.y_min) : 0
        };
    }

    // Presets
    loadUShape() {
        this.setObstacles([
            { p1: { x: 20, y: 20 }, p2: { x: 20, y: 80 } },
            { p1: { x: 20, y: 20 }, p2: { x: 80, y: 20 } },
            { p1: { x: 80, y: 20 }, p2: { x: 80, y: 80 } }
        ]);
    }

    loadCross() {
        this.setObstacles([
            { p1: { x: 50, y: 20 }, p2: { x: 50, y: 80 } },
            { p1: { x: 20, y: 50 }, p2: { x: 80, y: 50 } }
        ]);
    }

    loadRandom(count: number = 10) {
        const obs: Segment[] = [];
        for (let i = 0; i < count; i++) {
            const x = Math.random() * 80 + 10;
            const y = Math.random() * 80 + 10;
            const len = Math.random() * 10 + 5;
            const horizontal = Math.random() > 0.5;

            if (horizontal) {
                obs.push({ p1: { x, y }, p2: { x: x + len, y } });
            } else {
                obs.push({ p1: { x, y }, p2: { x, y: y + len } });
            }
        }
        this.setObstacles(obs);
    }
}
