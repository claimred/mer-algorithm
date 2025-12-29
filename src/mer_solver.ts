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
                if (!isVertical) {
                    const rC = this.solveCentral(jobBounds, jobObs, { x: job.parentCutX, y: cutVal });
                    const areaC = rectArea(rC);
                    if (areaC > maxArea) { maxArea = areaC; bestRect = rC; }
                } else {
                    jobStack.push({ ...job, type: JobType.HORIZONTAL_PARTITION, parentCutX: cutVal });
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

        for (const s of obstacles) {
            const minX = Math.min(s.p1.x, s.p2.x);
            const maxX = Math.max(s.p1.x, s.p2.x);

            if (isRightSide) {
                if (maxX < center.x - EPS) continue;
            } else {
                if (minX > center.x + EPS) continue;
            }

            if (s.p1.y > center.y + EPS) events.push({ x: s.p1.x, y: s.p1.y, is_top: true });
            if (s.p2.y > center.y + EPS) events.push({ x: s.p2.x, y: s.p2.y, is_top: true });
            if (s.p1.y < center.y - EPS) events.push({ x: s.p1.x, y: s.p1.y, is_top: false });
            if (s.p2.y < center.y - EPS) events.push({ x: s.p2.x, y: s.p2.y, is_top: false });

            // Segments that strictly CROSS the center line
            const minY = Math.min(s.p1.y, s.p2.y);
            const maxY = Math.max(s.p1.y, s.p2.y);
            if (minY < center.y - EPS && maxY > center.y + EPS) {
                if (isRightSide) {
                    if (s.p1.x > center.x + EPS) {
                        events.push({ x: s.p1.x, y: center.y, is_top: true });
                        events.push({ x: s.p1.x, y: center.y, is_top: false });
                    }
                    if (s.p2.x > center.x + EPS) {
                        events.push({ x: s.p2.x, y: center.y, is_top: true });
                        events.push({ x: s.p2.x, y: center.y, is_top: false });
                    }
                } else {
                    if (s.p1.x < center.x - EPS) {
                        events.push({ x: s.p1.x, y: center.y, is_top: true });
                        events.push({ x: s.p1.x, y: center.y, is_top: false });
                    }
                    if (s.p2.x < center.x - EPS) {
                        events.push({ x: s.p2.x, y: center.y, is_top: true });
                        events.push({ x: s.p2.x, y: center.y, is_top: false });
                    }
                }
            }

            // Handle segments exactly ON the center.y line (horizontal obstacles)
            const isOnCenterLine = Math.abs(s.p1.y - center.y) < EPS && Math.abs(s.p2.y - center.y) < EPS;
            if (isOnCenterLine) {
                if (isRightSide) {
                    if (s.p1.x > center.x + EPS) {
                        events.push({ x: s.p1.x, y: center.y, is_top: true });
                        events.push({ x: s.p1.x, y: center.y, is_top: false });
                    }
                    if (s.p2.x > center.x + EPS) {
                        events.push({ x: s.p2.x, y: center.y, is_top: true });
                        events.push({ x: s.p2.x, y: center.y, is_top: false });
                    }
                } else {
                    if (s.p1.x < center.x - EPS) {
                        events.push({ x: s.p1.x, y: center.y, is_top: true });
                        events.push({ x: s.p1.x, y: center.y, is_top: false });
                    }
                    if (s.p2.x < center.x - EPS) {
                        events.push({ x: s.p2.x, y: center.y, is_top: true });
                        events.push({ x: s.p2.x, y: center.y, is_top: false });
                    }
                }
            }
        }

        if (isRightSide) events.push({ x: bounds.x_max, y: bounds.y_max, is_top: true });
        else events.push({ x: bounds.x_min, y: bounds.y_max, is_top: true });

        events.sort((a, b) => isRightSide ? a.x - b.x : b.x - a.x);

        const steps: CombinedStep[] = [];
        let curTop = bounds.y_max;
        let curBot = bounds.y_min;

        steps.push({ x: center.x, y_top: curTop, y_bot: curBot });

        for (const ev of events) {
            if (isRightSide) { if (ev.x < center.x - EPS) continue; }
            else { if (ev.x > center.x + EPS) continue; }

            let changed = false;
            if (ev.is_top) {
                if (ev.y < curTop) { curTop = ev.y; changed = true; }
            } else {
                if (ev.y > curBot) { curBot = ev.y; changed = true; }
            }

            // Events at center.x update the initial step but don't create new ones
            if (Math.abs(ev.x - center.x) < EPS) {
                if (changed && steps.length > 0) {
                    steps[0].y_top = Math.min(steps[0].y_top, curTop);
                    steps[0].y_bot = Math.max(steps[0].y_bot, curBot);
                }
                continue;
            }

            if (changed) {
                if (steps.length > 0 && Math.abs(steps[steps.length - 1].x - ev.x) < EPS) {
                    steps[steps.length - 1].y_top = Math.min(steps[steps.length - 1].y_top, curTop);
                    steps[steps.length - 1].y_bot = Math.max(steps[steps.length - 1].y_bot, curBot);
                } else {
                    steps.push({ x: ev.x, y_top: curTop, y_bot: curBot });
                }
            }
        }

        // Always add a termination step at the bounds edge
        const boundX = isRightSide ? bounds.x_max : bounds.x_min;
        if (steps.length === 0 || Math.abs(steps[steps.length - 1].x - boundX) > EPS) {
            steps.push({ x: boundX, y_top: curTop, y_bot: curBot });
        }

        return steps;
    }
}
