import { Point, Segment } from './geometry';

export interface StairSegment {
    seg: Segment; // The constraint segment
    domainMin: number; // yMin
    domainMax: number; // yMax
}

export class Stair {
    constructor(public segments: StairSegment[]) { }

    /**
     * Get value x at y.
     * Assumes segments are sorted and cover y.
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
     * Returns Min X over interval [y1, y2]
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
                // Check endpoints of the segment in the range
                const v1 = s.seg.getX(iStart);
                const v2 = s.seg.getX(iEnd);
                minVal = Math.min(minVal, v1, v2);
            }
        }
        return found ? minVal : NaN;
    }

    /**
     * Returns Max X over interval [y1, y2]
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

export class StairBuilder {
    intervals: StairSegment[] = [];

    constructor(initialMin: number, initialMax: number, initialVal: number) {
        // Create a vertical segment representing the initial wall
        // Vertical segment: X is constant.
        const wall = new Segment({ x: initialVal, y: initialMin }, { x: initialVal, y: initialMax });
        this.intervals.push({
            seg: wall,
            domainMin: initialMin,
            domainMax: initialMax
        });
    }

    addConstraint(yMin: number, yMax: number, constraintSeg: Segment, isMinimizing: boolean) {
        const newIntervals: StairSegment[] = [];
        for (const interval of this.intervals) {
            // Compute overlap
            const start = Math.max(interval.domainMin, yMin);
            const end = Math.min(interval.domainMax, yMax);

            if (start < end - 1e-9) {
                // Parts before overlap
                if (interval.domainMin < start) {
                    newIntervals.push({ ...interval, domainMax: start });
                }

                // Overlap part
                const overlapSeg: StairSegment = {
                    seg: interval.seg,
                    domainMin: start,
                    domainMax: end
                };

                // Compare constraintSeg vs current seg (interval.seg)
                // We pick which one?
                // isMinimizing=true (Quad 1/4): we want SMALLER x.
                // isMinimizing=false (Quad 2/3): we want LARGER x.

                const mid = (start + end) / 2;
                const valCurrent = interval.seg.getX(mid);
                const valNew = constraintSeg.getX(mid);

                const betterAtStart = isMinimizing ? (constraintSeg.getX(start) < interval.seg.getX(start)) : (constraintSeg.getX(start) > interval.seg.getX(start));
                const betterAtEnd = isMinimizing ? (constraintSeg.getX(end) < interval.seg.getX(end)) : (constraintSeg.getX(end) > interval.seg.getX(end));

                if (betterAtStart && betterAtEnd) {
                    overlapSeg.seg = constraintSeg;
                } else if (!betterAtStart && !betterAtEnd) {
                    // Keep current
                } else {
                    // Intersection
                    // Simplified: just use the one better at midpoint for now to avoid complexity in this file,
                    // or do split.
                    // For robustness of v1 demo, let's pick the one better at midpoint.
                    // Note: This approximates the "Lower Envelope" but misses the exact vertex.
                    // Ideally we solve intersection.

                    // Let's try intersection approx:
                    const lC = this.getLine(interval.seg);
                    const lN = this.getLine(constraintSeg);
                    let crossY = start;
                    if (Math.abs(lC.m - lN.m) > 1e-9) {
                        crossY = (lN.c - lC.c) / (lC.m - lN.m);
                    } else {
                        crossY = mid;
                    }

                    if (crossY > start + 1e-9 && crossY < end - 1e-9) {
                        const seg1 = betterAtStart ? constraintSeg : interval.seg;
                        const seg2 = betterAtEnd ? constraintSeg : interval.seg;
                        newIntervals.push({ seg: seg1, domainMin: start, domainMax: crossY });
                        newIntervals.push({ seg: seg2, domainMin: crossY, domainMax: end });

                        if (interval.domainMax > end) {
                            newIntervals.push({ ...interval, domainMin: end });
                        }
                        continue;
                    } else {
                        if (isMinimizing ? (valNew < valCurrent) : (valNew > valCurrent)) {
                            overlapSeg.seg = constraintSeg;
                        }
                    }
                }
                newIntervals.push(overlapSeg);

                // Parts after overlap
                if (interval.domainMax > end) {
                    newIntervals.push({ ...interval, domainMin: end });
                }

            } else {
                newIntervals.push(interval);
            }
        }
        this.intervals = newIntervals;
    }

    getLine(s: Segment) {
        if (Math.abs(s.p1.y - s.p2.y) < 1e-9) return { m: 0, c: Math.max(s.p1.x, s.p2.x) };
        if (Math.abs(s.p1.x - s.p2.x) < 1e-9) return { m: 0, c: s.p1.x }; // Vertical: X = c. m=0 (dx/dy)

        // Slope dx/dy
        const m = (s.p2.x - s.p1.x) / (s.p2.y - s.p1.y);
        const c = s.p1.x - m * s.p1.y;
        return { m, c };
    }
}
