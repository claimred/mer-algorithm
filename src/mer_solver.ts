import { Rectangle, Segment, Point, rectArea } from './geometry';
import { Staircase, CombinedStep } from './staircase';
import { Matrix, monotoneMax } from './matrix_search';

enum JobType {
    VERTICAL_PARTITION,
    HORIZONTAL_PARTITION
}

interface Job {
    bounds: Rectangle;
    obstacles: Segment[];
    type: JobType;
    parentCutX: number;
}

class CentralMatrix implements Matrix {
    constructor(
        private leftSteps: CombinedStep[],
        private rightSteps: CombinedStep[]
    ) { }

    rows(): number { return this.leftSteps.length; }
    cols(): number { return this.rightSteps.length; }

    valueAt(row: number, col: number): number {
        const L = this.leftSteps[row];
        const R = this.rightSteps[col];

        const width = R.x - L.x;
        if (width <= 0) return 0.0;

        const top = Math.min(L.y_top, R.y_top);
        const bot = Math.max(L.y_bot, R.y_bot);
        const height = top - bot;

        if (height <= 0) return 0.0;

        return width * height;
    }
}

export class MerSolver {
    solve(bounds: Rectangle, obstacles: Segment[]): Rectangle {
        let bestRect: Rectangle = { x_min: 0, y_min: 0, x_max: 0, y_max: 0 };
        let maxArea = -1.0;

        const jobStack: Job[] = [];
        jobStack.push({
            bounds,
            obstacles,
            type: JobType.VERTICAL_PARTITION,
            parentCutX: 0.0
        });

        const EPS = 1e-9;

        while (jobStack.length > 0) {
            const job = jobStack.pop()!;
            const { bounds: jobBounds, obstacles: jobObs, type: jobType } = job;
            const currentArea = rectArea(jobBounds);

            // Base Case: No obstacles
            if (jobObs.length === 0) {
                if (currentArea > maxArea) {
                    maxArea = currentArea;
                    bestRect = jobBounds;
                }
                continue;
            }

            // Base Case: Single Obstacle
            if (jobObs.length === 1) {
                const s = jobObs[0];
                const minX = Math.min(s.p1.x, s.p2.x);
                const maxX = Math.max(s.p1.x, s.p2.x);
                const minY = Math.min(s.p1.y, s.p2.y);
                const maxY = Math.max(s.p1.y, s.p2.y);

                const candidates: Rectangle[] = [
                    { ...jobBounds, x_max: minX }, // Left
                    { ...jobBounds, x_min: maxX }, // Right
                    { ...jobBounds, y_max: minY }, // Bottom
                    { ...jobBounds, y_min: maxY }  // Top
                ];

                for (const r of candidates) {
                    const area = rectArea(r);
                    if (area > maxArea) {
                        maxArea = area;
                        bestRect = r;
                    }
                }
                continue;
            }

            // Partitioning
            const isVertical = (jobType === JobType.VERTICAL_PARTITION);
            const coords: number[] = [];

            for (const s of jobObs) {
                if (isVertical) {
                    if (s.p1.x > jobBounds.x_min && s.p1.x < jobBounds.x_max) coords.push(s.p1.x);
                    if (s.p2.x > jobBounds.x_min && s.p2.x < jobBounds.x_max) coords.push(s.p2.x);
                } else {
                    if (s.p1.y > jobBounds.y_min && s.p1.y < jobBounds.y_max) coords.push(s.p1.y);
                    if (s.p2.y > jobBounds.y_min && s.p2.y < jobBounds.y_max) coords.push(s.p2.y);
                }
            }

            // Degenerate Logic
            if (coords.length === 0) {
                if (!isVertical) {
                    let midY = (jobBounds.y_min + jobBounds.y_max) / 2.0;
                    if (jobObs.length > 0) midY = (jobObs[0].p1.y + jobObs[0].p2.y) / 2.0;

                    const rC = this.solveCentral(jobBounds, jobObs, { x: job.parentCutX, y: midY });
                    const areaC = rectArea(rC);
                    if (areaC > maxArea) { maxArea = areaC; bestRect = rC; }
                } else {
                    jobStack.push({ ...job, type: JobType.HORIZONTAL_PARTITION });
                }
                continue;
            }

            // Split coordinates selection - use first quartile to avoid degenerate cuts
            coords.sort((a, b) => a - b);
            const uniqueCoords = [...new Set(coords)];
            let cutIdx = 0;
            if (uniqueCoords.length > 1) {
                cutIdx = Math.floor(uniqueCoords.length / 4);
            }
            const cutVal = uniqueCoords[cutIdx];

            const set1: Segment[] = [];
            const set2: Segment[] = [];

            for (const s of jobObs) {
                const minV = isVertical ? Math.min(s.p1.x, s.p2.x) : Math.min(s.p1.y, s.p2.y);
                const maxV = isVertical ? Math.max(s.p1.x, s.p2.x) : Math.max(s.p1.y, s.p2.y);

                // Segments entirely in set1
                if (maxV <= cutVal + EPS && minV < cutVal - EPS) {
                    set1.push(s);
                }
                // Segments entirely in set2
                else if (minV >= cutVal - EPS && maxV > cutVal + EPS) {
                    set2.push(s);
                }
                // Segment is exactly on the cut line
                else if (Math.abs(minV - cutVal) < EPS && Math.abs(maxV - cutVal) < EPS) {
                    set1.push(s);
                    set2.push(s);
                }
                // Segment spans the cut line - split it
                else {
                    const p1 = s.p1;
                    const p2 = s.p2;
                    let cutPoint: Point = { x: 0, y: 0 };

                    if (isVertical) {
                        const slope = (p2.y - p1.y) / (p2.x - p1.x);
                        const yAtCut = p1.y + slope * (cutVal - p1.x);
                        cutPoint = { x: cutVal, y: yAtCut };
                    } else {
                        const invSlope = (p2.x - p1.x) / (p2.y - p1.y);
                        const xAtCut = p1.x + invSlope * (cutVal - p1.y);
                        cutPoint = { x: xAtCut, y: cutVal };
                    }

                    const pLow = isVertical
                        ? (p1.x < p2.x ? p1 : p2)
                        : (p1.y < p2.y ? p1 : p2);

                    const pHigh = isVertical
                        ? (p1.x < p2.x ? p2 : p1)
                        : (p1.y < p2.y ? p2 : p1);

                    set1.push({ p1: pLow, p2: cutPoint });
                    set2.push({ p1: cutPoint, p2: pHigh });
                }
            }

            // Recursion Guard
            const totalSplitCount = set1.length + set2.length;
            const noProgress = (totalSplitCount === 2 * jobObs.length) && (set1.length === jobObs.length) && (set2.length === jobObs.length);

            if (noProgress) {
                // Hard barrier split logic (Fixes Collinear)
                if (isVertical) {
                    const b1 = { ...jobBounds };
                    const b2 = { ...jobBounds };
                    b1.x_max = cutVal;
                    b2.x_min = cutVal;

                    const mid1 = (b1.x_min + b1.x_max) / 2;
                    const mid2 = (b2.x_min + b2.x_max) / 2;

                    jobStack.push({ bounds: b1, obstacles: set1, type: JobType.VERTICAL_PARTITION, parentCutX: mid1 });
                    jobStack.push({ bounds: b2, obstacles: set2, type: JobType.VERTICAL_PARTITION, parentCutX: mid2 });
                } else {
                    const b1 = { ...jobBounds };
                    const b2 = { ...jobBounds };
                    b1.y_max = cutVal;
                    b2.y_min = cutVal;

                    jobStack.push({ bounds: b1, obstacles: set1, type: JobType.HORIZONTAL_PARTITION, parentCutX: job.parentCutX });
                    jobStack.push({ bounds: b2, obstacles: set2, type: JobType.HORIZONTAL_PARTITION, parentCutX: job.parentCutX });
                }
                continue;
            }

            // Create Sub-problems
            const b1 = { ...jobBounds };
            const b2 = { ...jobBounds };

            if (isVertical) {
                b1.x_max = cutVal;
                b2.x_min = cutVal;

                jobStack.push({ bounds: b1, obstacles: set1, type: JobType.VERTICAL_PARTITION, parentCutX: 0 });
                jobStack.push({ bounds: b2, obstacles: set2, type: JobType.VERTICAL_PARTITION, parentCutX: 0 });
                jobStack.push({ ...job, type: JobType.HORIZONTAL_PARTITION, parentCutX: cutVal });
            } else {
                b1.y_max = cutVal;
                b2.y_min = cutVal;

                jobStack.push({ bounds: b1, obstacles: set1, type: JobType.HORIZONTAL_PARTITION, parentCutX: job.parentCutX });
                jobStack.push({ bounds: b2, obstacles: set2, type: JobType.HORIZONTAL_PARTITION, parentCutX: job.parentCutX });

                const rC = this.solveCentral(jobBounds, jobObs, { x: job.parentCutX, y: cutVal });
                const areaC = rectArea(rC);
                if (areaC > maxArea) { maxArea = areaC; bestRect = rC; }
            }
        }

        return bestRect;
    }

    private solveCentral(bounds: Rectangle, obstacles: Segment[], center: Point): Rectangle {
        const rightSteps = this.buildCombinedStaircase(center, obstacles, bounds, true);
        const leftSteps = this.buildCombinedStaircase(center, obstacles, bounds, false);

        if (rightSteps.length === 0 || leftSteps.length === 0) {
            return { x_min: center.x, y_min: center.y, x_max: center.x, y_max: center.y };
        }

        const matrix = new CentralMatrix(leftSteps, rightSteps);
        const bestCols = monotoneMax(matrix);

        let bestRect: Rectangle = { x_min: center.x, y_min: center.y, x_max: center.x, y_max: center.y };
        let maxArea = -1.0;

        for (let r = 0; r < bestCols.length; r++) {
            const c = bestCols[r];
            if (c < 0 || c >= rightSteps.length) continue;

            const val = matrix.valueAt(r, c);
            if (val > maxArea) {
                maxArea = val;
                const L = leftSteps[r];
                const R = rightSteps[c];
                const top = Math.min(L.y_top, R.y_top);
                const bot = Math.max(L.y_bot, R.y_bot);
                bestRect = { x_min: L.x, y_min: bot, x_max: R.x, y_max: top };
            }
        }
        return bestRect;
    }

    private buildCombinedStaircase(center: Point, obstacles: Segment[], bounds: Rectangle, isRightSide: boolean): CombinedStep[] {
        interface Event { x: number; y: number; is_top: boolean; }
        const events: Event[] = [];
        const EPS = 1e-9;

        let curTop = bounds.y_max;
        let curBot = bounds.y_min;

        // 1. Initial Scan
        for (const s of obstacles) {
            const minX = Math.min(s.p1.x, s.p2.x);
            const maxX = Math.max(s.p1.x, s.p2.x);
            const minY = Math.min(s.p1.y, s.p2.y);
            const maxY = Math.max(s.p1.y, s.p2.y);

            let coversCenter = false;
            // Strict inequality for 'covers' to ensure we capture segments that actually block the center line
            // Use slightly loose check to include touching segments that might affect the interval
            if (isRightSide) {
                // For right side, segment must start at or before center and extend to right
                if (minX <= center.x + EPS && maxX > center.x + EPS) coversCenter = true;
            } else {
                // For left side, segment must end at or after center and extend to left
                if (maxX >= center.x - EPS && minX < center.x - EPS) coversCenter = true;
            }

            if (coversCenter) {
                if ((minY < center.y - EPS && maxY > center.y + EPS) ||
                    (Math.abs(minY - center.y) < EPS && Math.abs(maxY - center.y) < EPS)) {
                    curTop = center.y;
                    curBot = center.y;
                }
                else if (minY >= center.y - EPS) {
                    curTop = Math.min(curTop, minY);
                }
                else if (maxY <= center.y + EPS) {
                    curBot = Math.max(curBot, maxY);
                }
            }
        }

        // 2. Event Generation
        for (const s of obstacles) {
            const minX = Math.min(s.p1.x, s.p2.x);
            const maxX = Math.max(s.p1.x, s.p2.x);

            if (isRightSide) {
                if (maxX < center.x - EPS) continue;
            } else {
                if (minX > center.x + EPS) continue;
            }

            // p1
            if (s.p1.y >= center.y - EPS) events.push({ x: s.p1.x, y: s.p1.y, is_top: true });
            if (s.p1.y <= center.y + EPS) events.push({ x: s.p1.x, y: s.p1.y, is_top: false });

            // p2
            if (s.p2.y >= center.y - EPS) events.push({ x: s.p2.x, y: s.p2.y, is_top: true });
            if (s.p2.y <= center.y + EPS) events.push({ x: s.p2.x, y: s.p2.y, is_top: false });

            // Vertical Segment Crossing Center Y ??
            const minY = Math.min(s.p1.y, s.p2.y);
            const maxY = Math.max(s.p1.y, s.p2.y);
            if (Math.abs(s.p1.x - s.p2.x) < EPS) { // Vertical
                if (minY < center.y - EPS && maxY > center.y + EPS) {
                    console.log(`Blocking Center Y at X=${s.p1.x}`);
                    // Falls strictly across center line -> Blocks everything at this X
                    events.push({ x: s.p1.x, y: center.y, is_top: true });
                    events.push({ x: s.p1.x, y: center.y, is_top: false });
                }
            }
        }

        if (isRightSide) events.push({ x: bounds.x_max, y: bounds.y_max, is_top: true });
        else events.push({ x: bounds.x_min, y: bounds.y_max, is_top: true });

        events.sort((a, b) => isRightSide ? a.x - b.x : b.x - a.x);

        const steps: CombinedStep[] = [];
        steps.push({ x: center.x, y_top: curTop, y_bot: curBot });

        let i = 0;
        while (i < events.length) {
            const ev = events[i];

            // Skip events on wrong side (redundant if filtered above but safe)
            if (isRightSide) { if (ev.x < center.x - EPS) { i++; continue; } }
            else { if (ev.x > center.x + EPS) { i++; continue; } }

            const currentX = ev.x;

            // Handle events strictly at center
            if (Math.abs(currentX - center.x) < EPS) {
                while (i < events.length && Math.abs(events[i].x - center.x) < EPS) {
                    const e = events[i];
                    if (e.is_top) curTop = Math.min(curTop, e.y);
                    else curBot = Math.max(curBot, e.y);
                    i++;
                }
                if (steps.length > 0) {
                    steps[0].y_top = Math.min(steps[0].y_top, curTop);
                    steps[0].y_bot = Math.max(steps[0].y_bot, curBot);
                }
                continue;
            }

            // Push step BEFORE update
            steps.push({ x: currentX, y_top: curTop, y_bot: curBot });

            // Apply updates
            while (i < events.length && Math.abs(events[i].x - currentX) < EPS) {
                const e = events[i];
                if (e.is_top) curTop = Math.min(curTop, e.y);
                else curBot = Math.max(curBot, e.y);
                i++;
            }
        }

        // Ensure we end at bounds
        const boundX = isRightSide ? bounds.x_max : bounds.x_min;
        if (steps.length === 0 || Math.abs(steps[steps.length - 1].x - boundX) > EPS) {
            steps.push({ x: boundX, y_top: curTop, y_bot: curBot });
        }

        return steps;
    }
}
