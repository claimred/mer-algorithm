
export interface Point {
    x: number;
    y: number;
}

export interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Represents a line segment defined by two endpoints.
 * Provides geometric utility methods for intersection and projection.
 */
export class Segment {
    constructor(public p1: Point, public p2: Point) { }

    get minX(): number { return Math.min(this.p1.x, this.p2.x); }
    get maxX(): number { return Math.max(this.p1.x, this.p2.x); }
    get minY(): number { return Math.min(this.p1.y, this.p2.y); }
    get maxY(): number { return Math.max(this.p1.y, this.p2.y); }

    /**
     * The slope (m) of the line containing this segment.
     * Returns Infinity for vertical lines.
     */
    get slope(): number {
        if (this.p1.x === this.p2.x) return Infinity; // Vertical
        return (this.p2.y - this.p1.y) / (this.p2.x - this.p1.x);
    }

    /**
     * The y-intercept (c) of the line containing this segment (y = mx + c).
     * Returns NaN for vertical lines.
     */
    get intercept(): number {
        if (this.p1.x === this.p2.x) return NaN;
        return this.p1.y - this.slope * this.p1.x;
    }

    /**
     * Calculates the Y coordinate on the line at a given X.
     * Note: This does NOT check if the X is within the segment's bounds.
     * @param x The X coordinate.
     * @returns The corresponding Y coordinate on the infinite line.
     */
    getY(x: number): number {
        if (Math.abs(this.p1.x - this.p2.x) < 1e-9) return Math.max(this.p1.y, this.p2.y);
        return this.slope * x + this.intercept;
    }

    /**
     * Calculates the X coordinate on the line at a given Y.
     * Note: This does NOT check if the Y is within the segment's bounds.
     * @param y The Y coordinate.
     * @returns The corresponding X coordinate on the infinite line.
     */
    getX(y: number): number {
        if (Math.abs(this.p1.y - this.p2.y) < 1e-9) return Math.max(this.p1.x, this.p2.x); // Horizontal
        if (!isFinite(this.slope)) return this.p1.x; // Vertical
        // x = (y - k) / m
        return (y - this.intercept) / this.slope;
    }
}

/**
 * Calculates the area of a rectangle.
 */
export function rectArea(r: Rectangle): number {
    return r.width * r.height;
}

/**
 * Optimizes the quadratic function f(x) = ax^2 + bx + c within the distinct interval [minX, maxX].
 * Checks boundary points and the vertex (critical point) if it lies within the interval.
 * 
 * @returns The x value maximizing the function and the maximum value itself.
 */
export function maximizeQuadratic(a: number, b: number, c: number, minX: number, maxX: number): { x: number, val: number } {
    // Critical point at x = -b / (2a)
    const candidates = [minX, maxX];
    if (Math.abs(a) > 1e-9) {
        const crit = -b / (2 * a);
        if (crit >= minX && crit <= maxX) {
            candidates.push(crit);
        }
    }

    let bestX = minX;
    let bestVal = -Infinity;

    for (const x of candidates) {
        const val = a * x * x + b * x + c;
        if (val > bestVal) {
            bestVal = val;
            bestX = x;
        }
    }

    return { x: bestX, val: bestVal };
}

/**
 * Checks if a segment intersects the STRICT interior of a rectangle.
 * Touching the boundary is NOT considered an intersection.
 * 
 * Used for verifying that the found Empty Rectangle is indeed empty.
 */
export function segmentIntersectsRectangle(s: Segment, r: Rectangle): boolean {
    const EPS = 1e-5;
    const rMinX = r.x + EPS;
    const rMaxX = r.x + r.width - EPS;
    const rMinY = r.y + EPS;
    const rMaxY = r.y + r.height - EPS;

    // Degenerate/Tiny rectangle
    if (rMinX >= rMaxX || rMinY >= rMaxY) return false;

    const minX = Math.min(s.p1.x, s.p2.x);
    const maxX = Math.max(s.p1.x, s.p2.x);
    const minY = Math.min(s.p1.y, s.p2.y);
    const maxY = Math.max(s.p1.y, s.p2.y);

    // Bounding box check (strict)
    if (maxX < rMinX || minX > rMaxX || maxY < rMinY || minY > rMaxY) return false;

    // Check if either endpoint is strictly inside
    if (s.p1.x > rMinX && s.p1.x < rMaxX && s.p1.y > rMinY && s.p1.y < rMaxY) return true;
    if (s.p2.x > rMinX && s.p2.x < rMaxX && s.p2.y > rMinY && s.p2.y < rMaxY) return true;

    // Check intersection with vertical lines x = rMinX, x = rMaxX within Y-range
    if (Math.abs(s.p1.x - s.p2.x) > 1e-9) {
        // x(t) is monotonic, check y at boundary x
        const yAtMinX = s.getY(rMinX);
        if (yAtMinX > rMinY && yAtMinX < rMaxY && ((s.p1.x <= rMinX && s.p2.x >= rMinX) || (s.p2.x <= rMinX && s.p1.x >= rMinX))) return true;

        const yAtMaxX = s.getY(rMaxX);
        if (yAtMaxX > rMinY && yAtMaxX < rMaxY && ((s.p1.x <= rMaxX && s.p2.x >= rMaxX) || (s.p2.x <= rMaxX && s.p1.x >= rMaxX))) return true;
    }

    // Check intersection with horizontal lines y = rMinY, y = rMaxY within X-range
    if (Math.abs(s.p1.y - s.p2.y) > 1e-9) {
        const xAtMinY = s.getX(rMinY);
        if (xAtMinY > rMinX && xAtMinY < rMaxX && ((s.p1.y <= rMinY && s.p2.y >= rMinY) || (s.p2.y <= rMinY && s.p1.y >= rMinY))) return true;

        const xAtMaxY = s.getX(rMaxY);
        if (xAtMaxY > rMinX && xAtMaxY < rMaxX && ((s.p1.y <= rMaxY && s.p2.y >= rMaxY) || (s.p2.y <= rMaxY && s.p1.y >= rMaxY))) return true;
    }

    return false;
}
