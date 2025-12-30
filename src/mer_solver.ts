import { Rectangle, Segment, Point, rectArea } from './geometry';
import { Stair, StairBuilder, StairSegment } from './staircase';
import { Matrix, monotoneMax } from './matrix_search';

export type SolverStepType = 'START' | 'SPLIT_VP' | 'SPLIT_HP' | 'SOLVE_CENTRAL' | 'FINISHED';

export interface SolverStep {
    type: SolverStepType;
    window?: Rectangle;
    splitVal?: number; // X or Y coordinate
}

/**
 * Represents a Divide-and-Conquer job in the solver stack.
 */
interface Job {
    window: Rectangle;
    segments: Segment[];
    type: 'VP' | 'HP';
    splitX?: number; // Only for HP jobs (inherited from VP split)
}

/**
 * Main Solver Class for the Maximum Empty Rectangle problem.
 */
export class MerSolver {
    private bestRect: Rectangle = { x: 0, y: 0, width: 0, height: 0 };
    private maxArea = 0;

    /**
     * Generator-based solver for Step-by-Step visualization and debugging.
     * Yields execution steps such as SPLIT_VP, SPLIT_HP.
     */
    *solveGenerator(obstacles: Rectangle[], floor: Rectangle): Generator<SolverStep, Rectangle, void> {
        const segments = this.obstaclesToSegments(obstacles, floor);

        // Delegate to the segment solver generator
        yield* this.solveSegmentsGenerator(segments, floor);

        return this.bestRect;
    }

    /**
     * Synchronous wrapper for compatibility.
     */
    solveSegments(segments: Segment[], floor: Rectangle): Rectangle {
        const iter = this.solveSegmentsGenerator(segments, floor);
        let res = iter.next();
        while (!res.done) {
            res = iter.next();
        }
        return this.bestRect;
    }

    /**
     * Internal generator that can also be used directly if working with Segments.
     */
    public *solveSegmentsGenerator(segments: Segment[], floor: Rectangle): Generator<SolverStep, Rectangle, void> {
        this.bestRect = { x: 0, y: 0, width: 0, height: 0 };
        this.maxArea = 0;

        const stack: Job[] = [];
        stack.push({
            window: floor,
            segments: segments,
            type: 'VP'
        });

        yield { type: 'START' as const, window: floor };

        while (stack.length > 0) {
            const job = stack.pop()!;

            // Base Case: No obstacles, the whole window is empty
            if (job.segments.length === 0) {
                this.updateMaxArea(job.window);
                continue;
            }

            if (job.type === 'VP') {
                yield* this.processVerticalSplit(job, stack);
            } else {
                yield* this.processHorizontalSplit(job, stack);
            }
        }

        yield { type: 'FINISHED' as const };
        return this.bestRect;
    }

    private *processVerticalSplit(job: Job, stack: Job[]) {
        const { window, segments: currSegs } = job;

        if (window.width < 0.1) return;

        // Coordinate Splitting: Choose VP
        const coords = getInternalCoords(currSegs, window.x, window.x + window.width, true);
        let VP = (coords.length > 0)
            ? coords[Math.floor(coords.length / 2)]
            : window.x + window.width / 2;

        yield { type: 'SPLIT_VP' as const, window, splitVal: VP };

        // 3. Crossing (HP Job) to be processed LATER (so push first? No, pop order is LIFO)
        // Order of pushing determines processing order (reverse). 
        // We want to process sub-problems. 
        // Push HP last means it's processed first? 
        // Original code: pushed left, right, then crossing. 
        // So crossing is processed first?
        // Let's stick to original order:
        // Pushing order: Left, Right, HP. => Pop order: HP, Right, Left.

        // 1. Left Subproblem
        const leftWindow = { ...window, width: VP - window.x };
        if (leftWindow.width > 1e-6) {
            const leftSegs = currSegs.filter(s => s.minX < VP + 1e-9);
            stack.push({ window: leftWindow, segments: leftSegs, type: 'VP' });
        }

        // 2. Right Subproblem
        const rightWindow = { ...window, x: VP, width: (window.x + window.width) - VP };
        if (rightWindow.width > 1e-6) {
            const rightSegs = currSegs.filter(s => s.maxX > VP - 1e-9);
            stack.push({ window: rightWindow, segments: rightSegs, type: 'VP' });
        }

        // 3. Crossing (HP Job)
        stack.push({ window: window, segments: currSegs, type: 'HP', splitX: VP });
    }

    private *processHorizontalSplit(job: Job, stack: Job[]) {
        const { window, segments: currSegs, splitX: VP } = job;

        if (window.height < 0.1) return;

        const coords = getInternalCoords(currSegs, window.y, window.y + window.height, false);
        let HP = (coords.length > 0)
            ? coords[Math.floor(coords.length / 2)]
            : window.y + window.height / 2;

        yield { type: 'SPLIT_HP' as const, window, splitVal: HP };

        // 1. Top Subproblem
        const topWindow = { ...window, y: HP, height: (window.y + window.height) - HP };
        if (topWindow.height > 1e-6) {
            const topSegs = currSegs.filter(s => s.maxY > HP - 1e-9);
            stack.push({ window: topWindow, segments: topSegs, type: 'HP', splitX: VP });
        }

        // 2. Bottom Subproblem
        const bottomWindow = { ...window, height: HP - window.y };
        if (bottomWindow.height > 1e-6) {
            const botSegs = currSegs.filter(s => s.minY < HP + 1e-9);
            stack.push({ window: bottomWindow, segments: botSegs, type: 'HP', splitX: VP });
        }

        // 3. Central Crossing Solution
        yield { type: 'SOLVE_CENTRAL' as const, window };

        // Logic split: solveCentral returns a Rect or updates maxArea?
        // Let's keep it returning Rect.
        const centralRect = solveCentral(currSegs, window, { x: VP!, y: HP });
        this.updateMaxArea(centralRect);
    }

    private updateMaxArea(r: Rectangle) {
        const area = rectArea(r);
        if (area > this.maxArea) {
            this.maxArea = area;
            this.bestRect = r;
        }
    }

    private obstaclesToSegments(obstacles: Rectangle[], floor: Rectangle): Segment[] {
        const segments: Segment[] = [];
        for (const r of obstacles) {
            const p1 = { x: r.x, y: r.y };
            const p2 = { x: r.x + r.width, y: r.y };
            const p3 = { x: r.x + r.width, y: r.y + r.height };
            const p4 = { x: r.x, y: r.y + r.height };
            segments.push(new Segment(p1, p2));
            segments.push(new Segment(p2, p3));
            segments.push(new Segment(p3, p4));
            segments.push(new Segment(p4, p1));
        }
        // Floor bounds
        segments.push(new Segment({ x: floor.x, y: floor.y }, { x: floor.x + floor.width, y: floor.y }));
        segments.push(new Segment({ x: floor.x + floor.width, y: floor.y }, { x: floor.x + floor.width, y: floor.y + floor.height }));
        segments.push(new Segment({ x: floor.x + floor.width, y: floor.y + floor.height }, { x: floor.x, y: floor.y + floor.height }));
        segments.push(new Segment({ x: floor.x, y: floor.y + floor.height }, { x: floor.x, y: floor.y }));
        return segments;
    }
}

/**
 * Public Entry Point
 */
export function solve(obstacles: Rectangle[], floor: Rectangle): Rectangle {
    const solver = new MerSolver();
    const iterator = solver.solveGenerator(obstacles, floor);
    let result = iterator.next();
    while (!result.done) {
        result = iterator.next();
    }
    return result.value as Rectangle;
}

/**
 * Solves the MER problem for a set of line segments.
 * This is the primary entry point used by tests and basic usage.
 */
export function solveSegments(segments: Segment[], floor: Rectangle): Rectangle {
    const solver = new MerSolver();
    return solver.solveSegments(segments, floor);
}

// --------------------------------------------------------------------------
// Internal Helper Functions
// --------------------------------------------------------------------------

function getInternalCoords(segments: Segment[], minVal: number, maxVal: number, isX: boolean): number[] {
    const coords: number[] = [];
    for (const s of segments) {
        const v1 = isX ? s.p1.x : s.p1.y;
        const v2 = isX ? s.p2.x : s.p2.y;
        if (v1 >= minVal - 1e-9 && v1 <= maxVal + 1e-9) coords.push(v1);
        if (v2 >= minVal - 1e-9 && v2 <= maxVal + 1e-9) coords.push(v2);
    }
    coords.sort((a, b) => a - b);

    // Unique
    const unique: number[] = [];
    if (coords.length > 0) {
        unique.push(coords[0]);
        for (let i = 1; i < coords.length; i++) {
            if (coords[i] > coords[i - 1] + 1e-6) unique.push(coords[i]);
        }
    }
    return unique.filter(c => c > minVal + 1e-9 && c < maxVal - 1e-9);
}

function solveCentral(segments: Segment[], window: Rectangle, center: Point): Rectangle {
    // Build 4 Maximal Empty Stairs
    const Q1 = buildStair(segments, 1, center, window);
    const Q2 = buildStair(segments, 2, center, window);
    const Q3 = buildStair(segments, 3, center, window);
    const Q4 = buildStair(segments, 4, center, window);

    return solveStairInteractions(Q1, Q2, Q3, Q4, center);
}

/**
 * Logic to build a single Quadrant Staircase.
 * Filters, clips, and merges segments into a monotonic boundary.
 */
function buildStair(segments: Segment[], quadrant: number, center: Point, window: Rectangle): Stair {
    const isMinimizingX = (quadrant === 1 || quadrant === 4);
    const isUpperY = (quadrant === 1 || quadrant === 2);

    const qYMin = Math.min(isUpperY ? center.y : window.y, isUpperY ? window.y + window.height : center.y);
    const qYMax = Math.max(isUpperY ? center.y : window.y, isUpperY ? window.y + window.height : center.y);
    const qXMin = (quadrant === 1 || quadrant === 4) ? center.x : window.x;
    const qXMax = (quadrant === 1 || quadrant === 4) ? window.x + window.width : center.x;

    const initialX = isMinimizingX ? (window.x + window.width) : window.x;
    const builder = new StairBuilder(qYMin, qYMax, initialX);
    const EPS = 1e-9;

    for (const s of segments) {
        // Broad phase culling
        if (s.maxY < qYMin || s.minY > qYMax) continue;
        if (s.maxX < qXMin || s.minX > qXMax) continue;

        const isHorizontal = Math.abs(s.p1.y - s.p2.y) < EPS;
        const isVertical = Math.abs(s.p1.x - s.p2.x) < EPS;

        if (isHorizontal) {
            handleHorizontalSegment(s, builder, qXMin, qXMax, qYMin, qYMax, isMinimizingX);
        } else if (isVertical) {
            handleVerticalSegment(s, builder, qXMin, qXMax, qYMin, qYMax, isMinimizingX);
        } else {
            handleSlopedSegment(s, builder, qXMin, qXMax, qYMin, qYMax, isMinimizingX);
        }
    }

    return new Stair(builder.intervals);
}

function handleVerticalSegment(
    s: Segment,
    builder: StairBuilder,
    qXMin: number, qXMax: number,
    qYMin: number, qYMax: number,
    isMinimizingX: boolean
) {
    const xVal = s.p1.x;
    const EPS = 1e-9;

    // Check if X is within bounds
    if (xVal < qXMin - EPS || xVal > qXMax + EPS) return;

    // Effective Y range is simply the intersection of segment Y and quadrant Y
    const effYMin = Math.max(s.minY, qYMin);
    const effYMax = Math.min(s.maxY, qYMax);

    if (effYMin < effYMax + EPS) {
        builder.addConstraint(effYMin, effYMax, s, isMinimizingX);
    }
}


function handleHorizontalSegment(
    s: Segment,
    builder: StairBuilder,
    qXMin: number, qXMax: number,
    qYMin: number, qYMax: number,
    isMinimizingX: boolean
) {
    const overlapMin = Math.max(s.minX, qXMin);
    const overlapMax = Math.min(s.maxX, qXMax);
    const EPS = 1e-9;

    if (overlapMin > overlapMax + EPS) return;

    // Effective X is the "hard wall" created by the horizontal segment looking from the center
    // Minimize (Q1/4): Hit leftmost point -> overlapMin
    // Maximize (Q2/3): Hit rightmost point -> overlapMax
    const effX = isMinimizingX ? overlapMin : overlapMax;

    // Create a proxy VERTICAL segment at effX to represent this wall
    const proxySeg = new Segment({ x: effX, y: s.minY }, { x: effX, y: s.maxY });

    // Clip Y range to quadrant
    const effYMin = Math.max(s.minY, qYMin);
    const effYMax = Math.min(s.maxY, qYMax);

    if (effYMin < effYMax + EPS) {
        builder.addConstraint(effYMin, effYMax, proxySeg, isMinimizingX);
    }
}

function handleSlopedSegment(
    s: Segment,
    builder: StairBuilder,
    qXMin: number, qXMax: number,
    qYMin: number, qYMax: number,
    isMinimizingX: boolean
) {
    // Determine effective Y range where the segment exists within the X-bounds of the quadrant
    // y = m*x + c
    const m = s.slope;
    const c = s.intercept;

    const y1 = m * qXMin + c;
    const y2 = m * qXMax + c;
    const yProjectedMin = Math.min(y1, y2);
    const yProjectedMax = Math.max(y1, y2);

    // Intersection of 3 intervals: 
    // 1. Segment's intrinsic Y range [s.minY, s.maxY]
    // 2. Quadrant's Y range [qYMin, qYMax]
    // 3. Projected Y range from X-bounds [yProjectedMin, yProjectedMax]

    const effYMin = Math.max(s.minY, qYMin, yProjectedMin);
    const effYMax = Math.min(s.maxY, qYMax, yProjectedMax);
    const EPS = 1e-9;

    if (effYMin < effYMax + EPS) {
        builder.addConstraint(effYMin, effYMax, s, isMinimizingX);
    }
}

function solveStairInteractions(s1: Stair, s2: Stair, s3: Stair, s4: Stair, center: Point): Rectangle {
    let maxArea = 0;
    let bestRect = { x: center.x, y: center.y, width: 0, height: 0 };

    const topRanges = intersectRanges(s1.segments, s2.segments);
    const botRanges = intersectRanges(s3.segments, s4.segments);

    if (topRanges.length === 0 || botRanges.length === 0) return bestRect;

    // Evaluate max area for a specific pair of top and bottom intervals
    const evaluatePairArea = (topIdx: number, botIdx: number): { area: number, rect?: Rectangle } => {
        const top = topRanges[topIdx];
        const bot = botRanges[botIdx];

        // Define function to verify and compute area for a specific candidate (yt, yb)
        // Returns 0 if invalid.
        const computeCandidate = (yt: number, yb: number): number => {
            if (yt <= yb) return 0;
            const cY = center.y;
            const EPS = 1e-5; // Epsilon to peek slightly inside the range

            // Verify width at these heights
            const minQ1 = s1.getMinX(cY, yt - EPS);
            const minQ4 = s4.getMinX(yb + EPS, cY);
            const maxQ2 = s2.getMaxX(cY, yt - EPS);
            const maxQ3 = s3.getMaxX(yb + EPS, cY);

            if (isNaN(minQ1) || isNaN(minQ4) || isNaN(maxQ2) || isNaN(maxQ3)) return 0;

            const xR = Math.min(minQ1, minQ4);
            const xL = Math.max(maxQ2, maxQ3);

            if (xR <= xL) return 0;
            return (xR - xL) * (yt - yb);
        };

        // Optimize over the 2D grid defined by [top.min, top.max] x [bot.min, bot.max]
        let localMax = -1;

        // 5x5 Grid Check heuristic + Corners
        // (Similar to previous implementation, ensuring we catch the max)
        const steps = 4;
        for (let i = 0; i <= steps; i++) {
            const yt = top.min + (top.max - top.min) * i / steps;
            for (let j = 0; j <= steps; j++) {
                const yb = bot.min + (bot.max - bot.min) * j / steps;
                localMax = Math.max(localMax, computeCandidate(yt, yb));
            }
        }

        return { area: localMax };
    };

    const matrix: Matrix = {
        rows: () => topRanges.length,
        cols: () => botRanges.length,
        valueAt: (r, c) => evaluatePairArea(r, c).area
    };

    // SMAWK / Monotone Matrix Search
    const bestCols = monotoneMax(matrix);

    // Scan for global maximum
    for (let r = 0; r < topRanges.length; r++) {
        const c = bestCols[r];
        const val = matrix.valueAt(r, c); // Re-evaluates, acceptable cost

        if (val > maxArea) {
            maxArea = val;

            // To reconstruct the rectangle, we need to basically "search" for the coordinates again
            // or we could have returned them from evaluatePairArea if we passed a flag.
            // For now, let's just do a quick re-computation for the BEST one.
            const top = topRanges[r];
            const bot = botRanges[c];

            // Re-run grid search with "save best rect" logic
            const cY = center.y;
            const steps = 4;
            for (let i = 0; i <= steps; i++) {
                const yt = top.min + (top.max - top.min) * i / steps;
                for (let j = 0; j <= steps; j++) {
                    const yb = bot.min + (bot.max - bot.min) * j / steps;
                    if (yt <= yb) continue;

                    const EPS = 1e-5;
                    const xR = Math.min(s1.getMinX(cY, yt - EPS), s4.getMinX(yb + EPS, cY));
                    const xL = Math.max(s2.getMaxX(cY, yt - EPS), s3.getMaxX(yb + EPS, cY));

                    if (xR > xL) {
                        const area = (xR - xL) * (yt - yb);
                        if (area >= maxArea - 1e-9) {
                            maxArea = area;
                            bestRect = { x: xL, y: yb, width: xR - xL, height: yt - yb };
                        }
                    }
                }
            }
        }
    }

    return bestRect;
}

function intersectRanges(list1: StairSegment[], list2: StairSegment[]) {
    const result = [];
    let i = 0, j = 0;
    while (i < list1.length && j < list2.length) {
        const int1 = list1[i];
        const int2 = list2[j];

        const start = Math.max(int1.domainMin, int2.domainMin);
        const end = Math.min(int1.domainMax, int2.domainMax);

        if (start < end - 1e-9) {
            result.push({
                min: start, max: end,
                s1: int1.seg, s2: int2.seg
            });
        }

        if (int1.domainMax < int2.domainMax) i++;
        else j++;
    }
    return result;
}
