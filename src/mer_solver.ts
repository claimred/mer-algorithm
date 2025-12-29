import { Rectangle, Segment, Point, rectArea } from './geometry';
import { Stair, StairBuilder, StairSegment } from './staircase';

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

export function solveSegments(segments: Segment[], floor: Rectangle): Rectangle {
    return divideAndConquerVP(segments, floor);
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

    return unique.filter(c => c > minVal + 1e-6 && c < maxVal - 1e-6);
}

function divideAndConquerVP(segments: Segment[], bounds: Rectangle): Rectangle {
    if (segments.length < 1) return bounds; // Actually correct? If no segments, entire bounds is empty.

    // Coordinate Splitting
    const coords = getInternalCoords(segments, bounds.x, bounds.x + bounds.width, true);

    if (coords.length === 0) {
        // No vertical endpoints inside. Switch to Horizontal.
        // This is a "Slab" where only horizontal spanning segments might exist.
        return divideAndConquerHP(segments, bounds, bounds.x + bounds.width / 2);
    }

    const midIdx = Math.floor(coords.length / 2);
    const VP = coords[midIdx];

    // 1. Left
    const leftBounds = { ...bounds, width: VP - bounds.x };
    const leftSegs = segments.filter(s => s.minX < VP + 1e-9);
    const maxLeft = (leftBounds.width > 1e-6) ? divideAndConquerVP(leftSegs, leftBounds) : { x: 0, y: 0, width: 0, height: 0 };

    // 2. Right
    const rightBounds = { ...bounds, x: VP, width: (bounds.x + bounds.width) - VP };
    const rightSegs = segments.filter(s => s.maxX > VP - 1e-9);
    const maxRight = (rightBounds.width > 1e-6) ? divideAndConquerVP(rightSegs, rightBounds) : { x: 0, y: 0, width: 0, height: 0 };

    // 3. Crossing
    const maxCrossing = divideAndConquerHP(segments, bounds, VP);

    return getBest([maxLeft, maxRight, maxCrossing]);
}

function divideAndConquerHP(segments: Segment[], bounds: Rectangle, VP: number): Rectangle {
    // Coordinate Splitting Y
    const coords = getInternalCoords(segments, bounds.y, bounds.y + bounds.height, false);

    if (coords.length === 0) {
        // No Y endpoints.
        // Run solveCentral at arbitrary HP (midpoint) to catch crossing largest rect.
        return solveCentral(segments, bounds, { x: VP, y: bounds.y + bounds.height / 2 });
    }

    const midIdx = Math.floor(coords.length / 2);
    const HP = coords[midIdx];

    // 1. Top
    const topBounds = { ...bounds, y: HP, height: (bounds.y + bounds.height) - HP };
    const topSegs = segments.filter(s => s.maxY > HP - 1e-9); // Segments in top
    const maxTop = (topBounds.height > 1e-6) ? divideAndConquerHP(topSegs, topBounds, VP) : { x: 0, y: 0, width: 0, height: 0 };

    // 2. Bottom
    const bottomBounds = { ...bounds, height: HP - bounds.y };
    const botSegs = segments.filter(s => s.minY < HP + 1e-9); // Segments in bot
    const maxBottom = (bottomBounds.height > 1e-6) ? divideAndConquerHP(botSegs, bottomBounds, VP) : { x: 0, y: 0, width: 0, height: 0 };

    // 3. Central
    const maxCentral = solveCentral(segments, bounds, { x: VP, y: HP });

    return getBest([maxTop, maxBottom, maxCentral]);
}

function solveCentral(segments: Segment[], bounds: Rectangle, center: Point): Rectangle {
    // Build 4 Maximal Empty Stairs
    const Q1 = buildStair(segments, 1, center, bounds);
    const Q2 = buildStair(segments, 2, center, bounds);
    const Q3 = buildStair(segments, 3, center, bounds);
    const Q4 = buildStair(segments, 4, center, bounds);

    return solveStairInteractions(Q1, Q2, Q3, Q4, center);
}

function buildStair(segments: Segment[], quadrant: number, center: Point, bounds: Rectangle): Stair {
    const isMinimizingX = (quadrant === 1 || quadrant === 4);
    const isUpperY = (quadrant === 1 || quadrant === 2);

    const yMin = isUpperY ? center.y : bounds.y;
    const yMax = isUpperY ? bounds.y + bounds.height : center.y;

    const xInit = isMinimizingX
        ? (bounds.x + bounds.width)
        : bounds.x;

    const builder = new StairBuilder(Math.min(yMin, yMax), Math.max(yMin, yMax), xInit);

    const qYMin = Math.min(yMin, yMax);
    const qYMax = Math.max(yMin, yMax);
    const qXMin = (quadrant === 1 || quadrant === 4) ? center.x : bounds.x;
    const qXMax = (quadrant === 1 || quadrant === 4) ? bounds.x + bounds.width : center.x;

    for (const s of segments) {
        if (s.maxY < qYMin || s.minY > qYMax) continue;
        if (s.maxX < qXMin || s.minX > qXMax) continue;

        builder.addConstraint(Math.max(s.minY, qYMin), Math.min(s.maxY, qYMax), s, isMinimizingX);
    }

    return new Stair(builder.intervals);
}

function solveStairInteractions(s1: Stair, s2: Stair, s3: Stair, s4: Stair, center: Point): Rectangle {
    let maxArea = 0;
    let bestRect = { x: center.x, y: center.y, width: 0, height: 0 };

    const topRanges = intersectRanges(s1.segments, s2.segments);
    const botRanges = intersectRanges(s3.segments, s4.segments);

    for (const top of topRanges) {
        for (const bot of botRanges) {
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
                if (area > maxArea) {
                    maxArea = area;
                    // Reconstruct
                    const cY = center.y;
                    const xR = Math.min(s1.getMinX(cY, yt), s4.getMinX(yb, cY));
                    const xL = Math.max(s2.getMaxX(cY, yt), s3.getMaxX(yb, cY));
                    bestRect = { x: xL, y: yb, width: xR - xL, height: yt - yb };
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
