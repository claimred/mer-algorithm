import { Segment } from './geometry';

/**
 * Represents a segment of the staircase boundary.
 * Maps a generic vertical interval [domainMin, domainMax] to a geometric obstacle segment.
 */
export interface StairSegment {
    seg: Segment; // The constraint segment
    domainMin: number; // yMin
    domainMax: number; // yMax
}

/**
 * A "Stair" represents the monotonic boundary of empty space in a quadrant.
 * It is essentially a piecewise-defined function x = f(y) representing the nearest obstacle.
 */
export class Stair {
    constructor(public segments: StairSegment[]) { }

    /**
     * Get value x at y.
     * Assumes segments are sorted by domain and cover y.
     */
    getX(y: number): number {
        for (const s of this.segments) {
            if (y >= s.domainMin - 1e-9 && y <= s.domainMax + 1e-9) {
                return s.seg.getX(y);
            }
        }
        // Fallback for floating point boundary issues
        if (this.segments.length > 0) {
            if (y < this.segments[0].domainMin) return this.segments[0].seg.getX(this.segments[0].domainMin);
            if (y > this.segments[this.segments.length - 1].domainMax) return this.segments[this.segments.length - 1].seg.getX(this.segments[this.segments.length - 1].domainMax);
        }
        return NaN;
    }

    /**
     * Returns Min X over interval [y1, y2] on this stair.
     */
    getMinX(y1: number, y2: number): number {
        let minVal = Infinity;
        const startY = Math.min(y1, y2);
        const endY = Math.max(y1, y2);

        let found = false;
        for (const s of this.segments) {
            const sMin = s.domainMin;
            const sMax = s.domainMax;
            const iStart = Math.max(sMin, startY);
            const iEnd = Math.min(sMax, endY);

            if (iStart <= iEnd + 1e-9) {
                found = true;
                // Check endpoints of the segment in the range because x(t) is monotonic for line segments
                const v1 = s.seg.getX(iStart);
                const v2 = s.seg.getX(iEnd);
                minVal = Math.min(minVal, v1, v2);
            }
        }
        return found ? minVal : NaN;
    }

    /**
     * Returns Max X over interval [y1, y2] on this stair.
     */
    getMaxX(y1: number, y2: number): number {
        let maxVal = -Infinity;
        const startY = Math.min(y1, y2);
        const endY = Math.max(y1, y2);

        let found = false;
        for (const s of this.segments) {
            const sMin = s.domainMin;
            const sMax = s.domainMax;
            const iStart = Math.max(sMin, startY);
            const iEnd = Math.min(sMax, endY);

            if (iStart <= iEnd + 1e-9) {
                found = true;
                const v1 = s.seg.getX(iStart);
                const v2 = s.seg.getX(iEnd);
                maxVal = Math.max(maxVal, v1, v2);
            }
        }
        return found ? maxVal : NaN;
    }
}

/**
 * Helper class to construct a Stair by merging overlapping constraints.
 * Maintains the sequence of intervals representing the "closest" wall found so far.
 */
export class StairBuilder {
    intervals: StairSegment[] = [];

    constructor(initialMin: number, initialMax: number, initialVal: number) {
        // Create a vertical segment representing the initial wall/bound
        const wall = new Segment({ x: initialVal, y: initialMin }, { x: initialVal, y: initialMax });
        this.intervals.push({
            seg: wall,
            domainMin: initialMin,
            domainMax: initialMax
        });
    }

    /**
     * Adds a new constraint segment to the staircase.
     * Updates intervals to respect the tighter constraint (smaller X if minimizing, larger X if maximizing).
     */
    addConstraint(yMin: number, yMax: number, constraintSeg: Segment, isMinimizing: boolean) {
        const newIntervals: StairSegment[] = [];
        const EPS = 1e-9;

        for (const interval of this.intervals) {
            // Compute overlap between current interval and constraint
            const start = Math.max(interval.domainMin, yMin);
            const end = Math.min(interval.domainMax, yMax);

            // If no valid overlap
            if (start > end + EPS) {
                newIntervals.push(interval);
                continue;
            }

            // 1. Pre-overlap part
            if (interval.domainMin < start - EPS) {
                newIntervals.push({ ...interval, domainMax: start });
            }

            // 2. Overlap part - resolve conflict
            const resolved = this.resolveOverlap(interval.seg, constraintSeg, start, end, isMinimizing);
            newIntervals.push(...resolved);

            // 3. Post-overlap part
            if (interval.domainMax > end + EPS) {
                newIntervals.push({ ...interval, domainMin: end });
            }
        }
        this.intervals = newIntervals;
    }

    /**
     * Resolves the conflict between two segments over an overlapping Y-interval.
     * Returns 1 or 2 new StairSegments depending on if they cross.
     */
    private resolveOverlap(
        currentSeg: Segment,
        newSeg: Segment,
        start: number,
        end: number,
        isMinimizing: boolean
    ): StairSegment[] {
        const mid = (start + end) / 2;

        // Check which one is better at start and end
        // "Better" means stricter constraint: smaller X if minimizing, larger X if maximizing.
        const valStartNew = newSeg.getX(start);
        const valStartCur = currentSeg.getX(start);
        const valEndNew = newSeg.getX(end);
        const valEndCur = currentSeg.getX(end);

        const betterAtStart = isMinimizing ? (valStartNew < valStartCur) : (valStartNew > valStartCur);
        const betterAtEnd = isMinimizing ? (valEndNew < valEndCur) : (valEndNew > valEndCur);

        // Case 1: One segment dominates the other completely on this interval
        if (betterAtStart && betterAtEnd) {
            return [{ seg: newSeg, domainMin: start, domainMax: end }];
        }
        if (!betterAtStart && !betterAtEnd) {
            // Current one is better (or equal) everywhere
            return [{ seg: currentSeg, domainMin: start, domainMax: end }];
        }

        // Case 2: Intersection
        // Find intersection Y
        const lC = this.getLine(currentSeg);
        const lN = this.getLine(newSeg);
        let crossY = mid;

        if (Math.abs(lC.m - lN.m) > 1e-9) {
            crossY = (lN.c - lC.c) / (lC.m - lN.m);
        }

        // Validate intersection is strictly inside
        if (crossY > start + 1e-9 && crossY < end - 1e-9) {
            const firstSeg = betterAtStart ? newSeg : currentSeg;
            const secondSeg = betterAtEnd ? newSeg : currentSeg;
            return [
                { seg: firstSeg, domainMin: start, domainMax: crossY },
                { seg: secondSeg, domainMin: crossY, domainMax: end }
            ];
        } else {
            // Fallback for near-parallel or numerical noise: pick winner at midpoint
            // This is "Case 1" logic re-applied at midpoint
            const valMidNew = newSeg.getX(mid);
            const valMidCur = currentSeg.getX(mid);
            const betterAtMid = isMinimizing ? (valMidNew < valMidCur) : (valMidNew > valMidCur);
            return [{ seg: betterAtMid ? newSeg : currentSeg, domainMin: start, domainMax: end }];
        }
    }

    private getLine(s: Segment) {
        if (Math.abs(s.p1.y - s.p2.y) < 1e-9) return { m: 0, c: Math.max(s.p1.x, s.p2.x) };
        if (Math.abs(s.p1.x - s.p2.x) < 1e-9) return { m: 0, c: s.p1.x }; // Vertical: x = c, treat m=0 for inverse logic? No. This helper is for x = my + c form.

        // Form x = m*y + c
        // slope dx/dy
        const m = (s.p2.x - s.p1.x) / (s.p2.y - s.p1.y);
        const c = s.p1.x - m * s.p1.y;
        return { m, c };
    }
}
