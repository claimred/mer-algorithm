import { MerSolver, SolverStep } from '@src/mer_solver';
import { Segment, Rectangle } from '@src/geometry';

export class State {
    public obstacles: Segment[] = [];
    public bounds: Rectangle = { x: 0, y: 0, width: 100, height: 100 };
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

    public solverStep: SolverStep | null = null;
    public iterator: Generator<SolverStep, Rectangle, void> | null = null;
    public isDebugging = false;

    solve() {
        const t0 = performance.now();
        this.result = this.solver.solveSegments(this.obstacles, this.bounds);
        const t1 = performance.now();
        this.isDebugging = false;
        this.solverStep = null;
        return {
            time: t1 - t0,
            area: this.result ? (this.result.width) * (this.result.height) : 0
        };
    }

    startDebug() {
        this.iterator = this.solver.solveSegmentsGenerator(this.obstacles, this.bounds);
        this.isDebugging = true;
        this.result = null;
        this.nextStep();
    }

    nextStep() {
        if (!this.iterator) return;
        const res = this.iterator.next();
        if (res.done) {
            this.result = res.value as Rectangle;
            this.iterator = null;
            this.isDebugging = false;
            this.solverStep = { type: 'FINISHED' };
        } else {
            this.solverStep = res.value;
        }
    }

    // Presets
    loadUShape() {
        this.setObstacles([
            new Segment({ x: 20, y: 20 }, { x: 20, y: 80 }),
            new Segment({ x: 20, y: 20 }, { x: 80, y: 20 }),
            new Segment({ x: 80, y: 20 }, { x: 80, y: 80 })
        ]);
    }

    loadCross() {
        this.setObstacles([
            new Segment({ x: 50, y: 20 }, { x: 50, y: 80 }),
            new Segment({ x: 20, y: 50 }, { x: 80, y: 50 })
        ]);
    }

    loadRandom(count: number = 10) {
        const obs: Segment[] = [];
        for (let i = 0; i < count; i++) {
            const x = Math.random() * 80 + 10;
            const y = Math.random() * 80 + 10;
            const len = Math.random() * 15 + 5;
            const angle = Math.random() * Math.PI * 2;

            const p2x = x + Math.cos(angle) * len;
            const p2y = y + Math.sin(angle) * len;

            obs.push(new Segment({ x, y }, { x: p2x, y: p2y }));
        }
        this.setObstacles(obs);
    }
}
