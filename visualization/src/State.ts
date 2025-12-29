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

    // Presets - use bounds-relative coordinates
    loadUShape() {
        const w = this.bounds.width;
        const h = this.bounds.height;
        this.setObstacles([
            new Segment({ x: w * 0.2, y: h * 0.2 }, { x: w * 0.2, y: h * 0.8 }),
            new Segment({ x: w * 0.2, y: h * 0.2 }, { x: w * 0.8, y: h * 0.2 }),
            new Segment({ x: w * 0.8, y: h * 0.2 }, { x: w * 0.8, y: h * 0.8 })
        ]);
    }

    loadCross() {
        const w = this.bounds.width;
        const h = this.bounds.height;
        this.setObstacles([
            new Segment({ x: w * 0.5, y: h * 0.2 }, { x: w * 0.5, y: h * 0.8 }),
            new Segment({ x: w * 0.2, y: h * 0.5 }, { x: w * 0.8, y: h * 0.5 })
        ]);
    }

    loadRandom(count: number = 10) {
        const obs: Segment[] = [];
        const margin = 10;
        const maxX = this.bounds.width - margin;
        const maxY = this.bounds.height - margin;

        for (let i = 0; i < count; i++) {
            const x = Math.random() * (maxX - margin) + margin;
            const y = Math.random() * (maxY - margin) + margin;
            const len = Math.random() * 15 + 5;
            const angle = Math.random() * Math.PI * 2;

            const p2x = x + Math.cos(angle) * len;
            const p2y = y + Math.sin(angle) * len;

            obs.push(new Segment({ x, y }, { x: p2x, y: p2y }));
        }
        this.setObstacles(obs);
    }

    setBounds(width: number, height: number) {
        this.bounds = { x: 0, y: 0, width, height };
    }
}
