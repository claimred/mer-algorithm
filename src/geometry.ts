export interface Point {
    x: number;
    y: number;
}

export interface Segment {
    p1: Point;
    p2: Point;
}

export interface Rectangle {
    x_min: number;
    y_min: number;
    x_max: number;
    y_max: number;
}

export function rectArea(r: Rectangle): number {
    return (r.x_max - r.x_min) * (r.y_max - r.y_min);
}

// Check if segment intersects rectangle
// Note: We use strict or non-strict intersection based on MER requirements.
export function segmentIntersectsRectangle(s: Segment, r: Rectangle): boolean {
    if (pointInRect(s.p1, r) || pointInRect(s.p2, r)) return true;

    const bl = { x: r.x_min, y: r.y_min };
    const br = { x: r.x_max, y: r.y_min };
    const tr = { x: r.x_max, y: r.y_max };
    const tl = { x: r.x_min, y: r.y_max };

    if (linesIntersect(s.p1, s.p2, bl, br)) return true;
    if (linesIntersect(s.p1, s.p2, br, tr)) return true;
    if (linesIntersect(s.p1, s.p2, tr, tl)) return true;
    if (linesIntersect(s.p1, s.p2, tl, bl)) return true;

    return false;
}

function pointInRect(p: Point, r: Rectangle): boolean {
    return p.x >= r.x_min && p.x <= r.x_max && p.y >= r.y_min && p.y <= r.y_max;
}

// Helper: boolean check for line segment intersection
function linesIntersect(p1: Point, p2: Point, q1: Point, q2: Point): boolean {
    const ccw = (a: Point, b: Point, c: Point) => {
        return (b.x - a.x) * (c.y - a.y) > (b.y - a.y) * (c.x - a.x);
    };
    return (ccw(p1, q1, q2) !== ccw(p2, q1, q2)) && (ccw(p1, p2, q1) !== ccw(p1, p2, q2));
}
