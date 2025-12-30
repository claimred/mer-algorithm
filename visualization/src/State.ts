import { MerSolver, SolverStep } from '@src/mer_solver';
import { Segment, Rectangle } from '@src/geometry';

export class State {
    public obstacles: Segment[] = [];
    public bounds: Rectangle = { x: 0, y: 0, width: 100, height: 100 };
    public result: Rectangle | null = null;
    public solver: MerSolver;

    // History
    private undoStack: { obstacles: Segment[], result: Rectangle | null }[] = [];
    private redoStack: { obstacles: Segment[], result: Rectangle | null }[] = [];
    private MAX_HISTORY = 50;

    constructor() {
        this.solver = new MerSolver();
    }

    private snapshot() {
        // Push current state to undo stack
        this.undoStack.push({
            obstacles: [...this.obstacles], // Shallow copy of array is enough if segments are immutable-ish, but let's be safe
            result: this.result ? { ...this.result } : null
        });

        if (this.undoStack.length > this.MAX_HISTORY) {
            this.undoStack.shift(); // Drop oldest
        }

        // Clear redo stack on new action
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length === 0) return;

        // Push current to redo
        this.redoStack.push({
            obstacles: [...this.obstacles],
            result: this.result ? { ...this.result } : null
        });

        // Pop from undo
        const state = this.undoStack.pop()!;
        this.obstacles = state.obstacles;
        this.result = state.result;
    }

    redo() {
        if (this.redoStack.length === 0) return;

        // Push current to undo
        this.undoStack.push({
            obstacles: [...this.obstacles],
            result: this.result ? { ...this.result } : null
        });

        // Pop from redo
        const state = this.redoStack.pop()!;
        this.obstacles = state.obstacles;
        this.result = state.result;
    }

    canUndo() { return this.undoStack.length > 0; }
    canRedo() { return this.redoStack.length > 0; }

    addObstacle(s: Segment) {
        this.snapshot();
        this.obstacles.push(s);
        this.result = null; // Invalidate result
    }

    setObstacles(obs: Segment[]) {
        this.snapshot();
        this.obstacles = obs;
        this.result = null;
    }

    clear() {
        this.snapshot();
        this.obstacles = [];
        this.result = null;
    }

    public solverStep: SolverStep | null = null;
    public iterator: Generator<SolverStep, Rectangle, void> | null = null;
    public isDebugging = false;

    solve() {
        this.snapshot(); // Solve changes the result, so snapshot
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

    // Advanced Presets
    loadComb() {
        // Interleaving vertical bars
        const w = this.bounds.width;
        const h = this.bounds.height;
        const obs: Segment[] = [];
        const count = 10;
        const step = w / (count + 1);

        for (let i = 1; i <= count; i++) {
            const x = i * step;
            if (i % 2 === 0) {
                // Top down
                obs.push(new Segment({ x, y: 0 }, { x, y: h * 0.8 }));
            } else {
                // Bottom up
                obs.push(new Segment({ x, y: h }, { x, y: h * 0.2 }));
            }
        }
        this.setObstacles(obs);
    }

    loadSpiral() {
        const w = this.bounds.width;
        const h = this.bounds.height;
        const cx = w / 2;
        const cy = h / 2;
        const obs: Segment[] = [];
        const step = 20; // gap size

        let x = cx;
        let y = cy;
        let len = step;
        let dir = 0; // 0: right, 1: down, 2: left, 3: up

        // Cover the largest dimension
        const maxLen = Math.max(w, h);

        // Limit loop to prevent infinite run if logic is off, but maxLen should suffice
        while (len < maxLen + step) {
            let nx = x;
            let ny = y;

            if (dir === 0) nx += len;
            else if (dir === 1) ny += len;
            else if (dir === 2) nx -= len;
            else if (dir === 3) ny -= len; // Up requires negative change

            // Clamp to bounds
            const cnx = Math.max(0, Math.min(w, nx));
            const cny = Math.max(0, Math.min(h, ny));
            const cx_start = Math.max(0, Math.min(w, x));
            const cy_start = Math.max(0, Math.min(h, y));

            // Only add if length > epsilon
            if (Math.abs(cnx - cx_start) > 0.1 || Math.abs(cny - cy_start) > 0.1) {
                obs.push(new Segment({ x: cx_start, y: cy_start }, { x: cnx, y: cny }));
            }

            // Update real coordinates for logic, but clamp will effectively "trace" the wall if we hit it
            x = nx;
            y = ny;

            dir = (dir + 1) % 4;
            if (dir === 0 || dir === 2) {
                len += step;
            }
        }

        this.setObstacles(obs);
    }

    loadMaze() {
        // Recursive division simulation (simple grid with holes)
        const w = this.bounds.width;
        const h = this.bounds.height;
        const cols = 8;
        const rows = 8;
        const cellW = w / cols;
        const cellH = h / rows;
        const obs: Segment[] = [];

        // Vertical lines
        for (let c = 1; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                if (Math.random() > 0.4) {
                    obs.push(new Segment(
                        { x: c * cellW, y: r * cellH },
                        { x: c * cellW, y: (r + 1) * cellH }
                    ));
                }
            }
        }

        // Horizontal lines
        for (let r = 1; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (Math.random() > 0.4) {
                    obs.push(new Segment(
                        { x: c * cellW, y: r * cellH },
                        { x: (c + 1) * cellW, y: r * cellH }
                    ));
                }
            }
        }
        this.setObstacles(obs);
    }

    loadStaircase() {
        const w = this.bounds.width;
        const h = this.bounds.height;
        const steps = 10;
        const obs: Segment[] = [];

        for (let i = 0; i < steps; i++) {
            const x1 = (i / steps) * w;
            const y1 = h - (i / steps) * h;
            const x2 = ((i + 1) / steps) * w;
            const y2 = y1;
            const y3 = h - ((i + 1) / steps) * h;

            // Horizontal step
            obs.push(new Segment({ x: x1, y: y1 }, { x: x2, y: y2 }));
            // Vertical step
            obs.push(new Segment({ x: x2, y: y2 }, { x: x2, y: y3 }));
        }
        this.setObstacles(obs);
    }

    loadDense() {
        // Just call random with high count
        this.loadRandom(50);
    }

    loadStar() {
        const w = this.bounds.width;
        const h = this.bounds.height;
        const cx = w / 2;
        const cy = h / 2;
        const radius = Math.min(w, h) * 0.4;
        const obs: Segment[] = [];
        const rays = 12;

        for (let i = 0; i < rays; i++) {
            const angle = (i / rays) * Math.PI * 2;
            obs.push(new Segment(
                { x: cx, y: cy },
                {
                    x: cx + Math.cos(angle) * radius,
                    y: cy + Math.sin(angle) * radius
                }
            ));
        }
        this.setObstacles(obs);
    }

    setBounds(width: number, height: number) {
        this.bounds = { x: 0, y: 0, width, height };
    }
}
