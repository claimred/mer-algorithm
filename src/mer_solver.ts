import { Rectangle, Segment, Point, rectArea } from './geometry';
import { Stair, StairBuilder, StairSegment } from './staircase';
import { Matrix, monotoneMax } from './matrix_search';

export function solve(obstacles: Rectangle[], floor: Rectangle): Rectangle {
    const segments: Segment[] = [];
    // Convert rectangles to 4 segments
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
    // Add floor boundaries as obstacles (inward facing)
    // Fix: Floor boundaries should NOT be added as specific segments to split on?
    // They are boundaries. If we add them, they are just segments.
    // Solver expects segments INSIDE bounds. 
    // If we add floor segments, they align with bounds.
    // It's fine to add them constraints.

    segments.push(new Segment({ x: floor.x, y: floor.y }, { x: floor.x + floor.width, y: floor.y }));
    segments.push(new Segment({ x: floor.x + floor.width, y: floor.y }, { x: floor.x + floor.width, y: floor.y + floor.height }));
    segments.push(new Segment({ x: floor.x + floor.width, y: floor.y + floor.height }, { x: floor.x, y: floor.y + floor.height }));
    segments.push(new Segment({ x: floor.x, y: floor.y + floor.height }, { x: floor.x, y: floor.y }));

    return solveSegments(segments, floor);
}

interface Job {
    window: Rectangle;
    segments: Segment[];
    type: 'VP' | 'HP';
    splitX?: number; // Only for HP jobs (inherited from VP split)
}

export function solveSegments(segments: Segment[], floor: Rectangle): Rectangle {
    let bestRect = { x: 0, y: 0, width: 0, height: 0 };
    let maxArea = 0;

    const stack: Job[] = [];
    stack.push({
        window: floor,
        segments: segments,
        type: 'VP'
    });

    while (stack.length > 0) {
        const job = stack.pop()!;
        const { window, segments: currSegs, type, splitX } = job;

        // Base Case 0: No obstacles
        if (currSegs.length === 0) {
            const area = rectArea(window);
            if (area > maxArea) {
                maxArea = area;
                bestRect = window;
            }
            continue;
        }

        if (type === 'VP') {
            // Termination for spatial recursion (avoid infinite depth on spanning segments)
            if (window.width < 0.1) continue;

            // Coordinate Splitting
            const coords = getInternalCoords(currSegs, window.x, window.x + window.width, true);
            let VP = 0;

            if (coords.length > 0) {
                const midIdx = Math.floor(coords.length / 2);
                VP = coords[midIdx];
            } else {
                // Fallback: Spatial Split
                VP = window.x + window.width / 2;
            }

            // 1. Left
            const leftWindow = { ...window, width: VP - window.x };
            if (leftWindow.width > 1e-6) {
                const leftSegs = currSegs.filter(s => s.minX < VP + 1e-9);
                stack.push({ window: leftWindow, segments: leftSegs, type: 'VP' });
            }

            // 2. Right
            const rightWindow = { ...window, x: VP, width: (window.x + window.width) - VP };
            if (rightWindow.width > 1e-6) {
                const rightSegs = currSegs.filter(s => s.maxX > VP - 1e-9);
                stack.push({ window: rightWindow, segments: rightSegs, type: 'VP' });
            }

            // 3. Crossing (HP Job)
            stack.push({ window: window, segments: currSegs, type: 'HP', splitX: VP });
        } else {
            // HP Job
            if (window.height < 0.1) continue;

            // Coordinate Splitting Y
            const coords = getInternalCoords(currSegs, window.y, window.y + window.height, false);
            let HP = 0;

            if (coords.length > 0) {
                const midIdx = Math.floor(coords.length / 2);
                HP = coords[midIdx];
            } else {
                // Fallback: Spatial Split Y
                HP = window.y + window.height / 2;
            }

            const VP = splitX!; // Must exist for HP job spawned by VP

            // 1. Top
            const topWindow = { ...window, y: HP, height: (window.y + window.height) - HP };
            if (topWindow.height > 1e-6) {
                const topSegs = currSegs.filter(s => s.maxY > HP - 1e-9);
                stack.push({ window: topWindow, segments: topSegs, type: 'HP', splitX: VP });
            }

            // 2. Bottom
            const bottomWindow = { ...window, height: HP - window.y };
            if (bottomWindow.height > 1e-6) {
                const botSegs = currSegs.filter(s => s.minY < HP + 1e-9);
                stack.push({ window: bottomWindow, segments: botSegs, type: 'HP', splitX: VP });
            }

            // 3. Central (Solve directly)
            const centralRect = solveCentral(currSegs, window, { x: VP, y: HP });
            const area = rectArea(centralRect);
            if (area > maxArea) {
                maxArea = area;
                bestRect = centralRect;
            }
        }
    }

    return bestRect;
}


// Helper to get unique sorted coordinates inside bounds
function getInternalCoords(segments: Segment[], minVal: number, maxVal: number, isX: boolean): number[] {
    const coords: number[] = [];
    for (const s of segments) {
        const v1 = isX ? s.p1.x : s.p1.y;
        const v2 = isX ? s.p2.x : s.p2.y;
        // Strict inequality to avoid boundary issues? 
        // We want endpoints INSIDE the slab.
        if (v1 >= minVal - 1e-9 && v1 <= maxVal + 1e-9) coords.push(v1); // Include boundary? 
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

    // Filter strictly inside? 
    // Nandy: Split at median of sorted distinct coordinates.
    // If all coords are on boundary, what happens?
    // Then we have no "internal" split point.
    // But we might have segments spanning.

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

function buildStair(segments: Segment[], quadrant: number, center: Point, window: Rectangle): Stair {
    const isMinimizingX = (quadrant === 1 || quadrant === 4);
    const isUpperY = (quadrant === 1 || quadrant === 2);

    const yMin = isUpperY ? center.y : window.y;
    const yMax = isUpperY ? window.y + window.height : center.y;

    const xInit = isMinimizingX
        ? (window.x + window.width)
        : window.x;

    const builder = new StairBuilder(Math.min(yMin, yMax), Math.max(yMin, yMax), xInit);

    const qYMin = Math.min(yMin, yMax);
    const qYMax = Math.max(yMin, yMax);
    const qXMin = (quadrant === 1 || quadrant === 4) ? center.x : window.x;
    const qXMax = (quadrant === 1 || quadrant === 4) ? window.x + window.width : center.x;

    const EPS = 1e-9;

    for (const s of segments) {
        // Broad phase Y
        if (s.maxY < qYMin || s.minY > qYMax) continue;
        // Broad phase X
        if (s.maxX < qXMin || s.minX > qXMax) continue;

        // Clip s to Y-range [qYMin, qYMax] AND X-range [qXMin, qXMax]
        // 1. Current effective Y range
        let effYMin = Math.max(s.minY, qYMin);
        let effYMax = Math.min(s.maxY, qYMax);

        if (effYMin > effYMax + EPS) continue;

        // 2. Check X range within this Y interval.
        // If segment is vertical, X is constant.
        if (Math.abs(s.p1.x - s.p2.x) < EPS) {
            const xVal = s.p1.x;
            if (xVal < qXMin - EPS || xVal > qXMax + EPS) continue;
        } else {
            // Non-vertical, check intersections with qXMin, qXMax
            const slope = s.slope;
            const intercept = s.intercept;
            // x = (y - c) / m ? No, x = my + c no. y = mx + c.
            // Line eqs: x = (y - intercept) * (1/slope) ??
            // Segment: x(y).
            // We need y where x(y) = qXMin and x(y) = qXMax.
            // Segment.getX(y) is implemented.
            // We need inverse: getY(x).

            // y = m'x + c' form from Point-Slope or similar.
            // Let's use getLine to be safe or geometry.
            // Actually, if we just check endpoints at effYMin, effYMax?
            // Monotonic X/Y means min/max X occur at boundaries of Y-interval.
            const xAtYMin = s.getX(effYMin);
            const xAtYMax = s.getX(effYMax);

            const minXSeg = Math.min(xAtYMin, xAtYMax);
            const maxXSeg = Math.max(xAtYMin, xAtYMax);

            // If completely outside X-range
            if (maxXSeg < qXMin - EPS || minXSeg > qXMax + EPS) continue;

            // Refine effYMin, effYMax if it crosses X-boundaries
            // We want the subset of [effYMin, effYMax] where x(y) in [qXMin, qXMax].
            // x(y) is linear.
            // Solve x(y) = qXMin.
            // Solve x(y) = qXMax.

            // y(x) = slope * x + intercept ?? 
            // Segment.slope is dy/dx.
            // y = slope * x + intercept.
            // y1 = slope * qXMin + intercept. 
            // y2 = slope * qXMax + intercept.

            const yAtXMin = s.getY(qXMin);
            const yAtXMax = s.getY(qXMax);

            // We intersect [effYMin, effYMax] with Y-range implied by X in [qXMin, qXMax].
            // The segment part inside X-bounds has Y-range [min(yAtXMin, yAtXMax), max(...)].
            // WAIT. Infinite line intersection. The segment might not reach X-bounds.
            // We need intersection of "Segment Box" with "Quadrant Box".
            // We already know segment overlaps quadrant box (Broad phase).
            // We want interval of Y.

            // If slope != 0 (not horizontal) and not infinite.
            // y(x) is monotonic.
            // Valid Y range is intersection of [s.minY, s.maxY] AND [y(qXMin), y(qXMax)] (bounded by box) AND [qYMin, qYMax].
            // Actually, just clipping segment to box [qXMin, qXMax] x [qYMin, qYMax].
            // The clipped segment has a Y-range.

            // Intersection of Line and Box.
            let yRangeMin = -Infinity;
            let yRangeMax = Infinity;

            // Clip by Y bounds
            yRangeMin = Math.max(yRangeMin, qYMin, s.minY);
            yRangeMax = Math.min(yRangeMax, qYMax, s.maxY);

            // Clip by X bounds (Projected to Y via line eq)
            // x(y) = (y - intercept_y) / slope_y ? No.
            // s.getX(y) logic: (y - intercept) / slope  (where slope is dy/dx, intercept is y-intercept).
            // x = (y - c)/m.
            // We want qXMin <= (y-c)/m <= qXMax.
            // If m > 0: m*qXMin + c <= y <= m*qXMax + c.
            // If m < 0: m*qXMax + c <= y <= m*qXMin + c.

            const m = s.slope;
            const c = s.intercept;
            if (Math.abs(m) > EPS) { // if m=0 (horizontal), X is undefined/range. handled separately?
                // If horizontal, m=0. y is constant.
                // Handled below?
                const y1 = m * qXMin + c;
                const y2 = m * qXMax + c;
                const iyMin = Math.min(y1, y2);
                const iyMax = Math.max(y1, y2);

                yRangeMin = Math.max(yRangeMin, iyMin);
                yRangeMax = Math.min(yRangeMax, iyMax);
            }

            effYMin = yRangeMin;
            effYMax = yRangeMax;
        }

        if (effYMin < effYMax + EPS) {
            builder.addConstraint(effYMin, effYMax, s, isMinimizingX);
        }
    }

    return new Stair(builder.intervals);
}


function solveStairInteractions(s1: Stair, s2: Stair, s3: Stair, s4: Stair, center: Point): Rectangle {
    let maxArea = 0;
    let bestRect = { x: center.x, y: center.y, width: 0, height: 0 };

    const topRanges = intersectRanges(s1.segments, s2.segments);
    const botRanges = intersectRanges(s3.segments, s4.segments);



    // Optimize using Monotone Matrix Search (SMAWK)
    // Rows: Top intervals
    // Cols: Bottom intervals
    // Value: Max area for that pair

    if (topRanges.length === 0 || botRanges.length === 0) return bestRect;

    const matrix: Matrix = {
        rows: () => topRanges.length,
        cols: () => botRanges.length,
        valueAt: (r: number, c: number) => {
            const top = topRanges[r];
            const bot = botRanges[c];

            // Same heuristic/optimization logic as before to find max for this pair
            let locMax = -1;

            const evalArea = (yt: number, yb: number) => {
                if (!top.s1 || !top.s2 || !bot.s1 || !bot.s2) return 0;
                if (yt <= yb) return 0;

                const cY = center.y;
                const minQ1 = s1.getMinX(cY, yt);
                const minQ4 = s4.getMinX(yb, cY);
                const maxQ2 = s2.getMaxX(cY, yt);
                const maxQ3 = s3.getMaxX(yb, cY);

                if (isNaN(minQ1) || isNaN(minQ4) || isNaN(maxQ2) || isNaN(maxQ3)) return 0;

                const xR = Math.min(minQ1, minQ4);
                const xL = Math.max(maxQ2, maxQ3);

                if (xR <= xL) return 0;
                return (xR - xL) * (yt - yb);
            };

            // Grid search + corners
            const check = (yt: number, yb: number) => {
                const area = evalArea(yt, yb);
                if (area > locMax) {
                    locMax = area;
                }
            };

            check(top.min, bot.min);
            check(top.min, bot.max);
            check(top.max, bot.min);
            check(top.max, bot.max);

            // 5x5 grid
            for (let i = 0; i <= 4; i++) {
                for (let j = 0; j <= 4; j++) {
                    check(top.min + (top.max - top.min) * i / 4, bot.min + (bot.max - bot.min) * j / 4);
                }
            }
            return locMax;
        }
    };

    // Get best column for each row in O(N)
    const bestCols = monotoneMax(matrix);

    // Iterate to find global max
    for (let r = 0; r < topRanges.length; r++) {
        const c = bestCols[r];
        const val = matrix.valueAt(r, c);

        if (val > maxArea) {
            maxArea = val;
            // Recover rect?
            // We need to reconstruct the rect parameters for the best val.
            // valueAt only returned area. 
            // We can re-run check logic or modify valueAt to store state?
            // Re-running check for the SINGLE best pair is cheap.

            const top = topRanges[r];
            const bot = botRanges[c];

            // Re-run optimization for this pair to capture bestRect
            // (Code duplication unideal but robust)
            const evalArea = (yt: number, yb: number) => {
                // ... same ...
                if (!top.s1 || !top.s2 || !bot.s1 || !bot.s2) return 0;
                if (yt <= yb) return 0;
                const cY = center.y;
                const minQ1 = s1.getMinX(cY, yt);
                const minQ4 = s4.getMinX(yb, cY);
                const maxQ2 = s2.getMaxX(cY, yt);
                const maxQ3 = s3.getMaxX(yb, cY);
                if (isNaN(minQ1) || isNaN(minQ4) || isNaN(maxQ2) || isNaN(maxQ3)) return 0;
                const xR = Math.min(minQ1, minQ4);
                const xL = Math.max(maxQ2, maxQ3);
                if (xR <= xL) return 0;
                return (xR - xL) * (yt - yb);
            };

            const check = (yt: number, yb: number) => {
                const area = evalArea(yt, yb);
                if (area >= maxArea - 1e-9) { // strictness?
                    // Found it
                    const cY = center.y;
                    const xR = Math.min(s1.getMinX(cY, yt), s4.getMinX(yb, cY));
                    const xL = Math.max(s2.getMaxX(cY, yt), s3.getMaxX(yb, cY));
                    bestRect = { x: xL, y: yb, width: xR - xL, height: yt - yb };
                    maxArea = area;
                }
            };

            check(top.min, bot.min);
            check(top.min, bot.max);
            check(top.max, bot.min);
            check(top.max, bot.max);
            for (let i = 0; i <= 4; i++) {
                for (let j = 0; j <= 4; j++) {
                    check(top.min + (top.max - top.min) * i / 4, bot.min + (bot.max - bot.min) * j / 4);
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

function getBest(rects: Rectangle[]): Rectangle {
    let best = rects[0];
    let maxA = rectArea(best);
    for (let i = 1; i < rects.length; i++) {
        const area = rectArea(rects[i]);
        if (area > maxA) {
            maxA = area;
            best = rects[i];
        }
    }
    return best;
}
