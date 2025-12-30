import { MerSolver, solveSegments } from './src/mer_solver';
import { Segment, Rectangle, rectArea } from './src/geometry';

const bounds: Rectangle = { x: 0, y: 0, width: 100, height: 100 };

// Scenario: Cross Shape
// Horizontal (20, 50)-(80, 50)
// Vertical (50, 20)-(50, 80)
// This creates 4 open corners.
// But critically, the space LEFT of 50 is (0,0)-(50,100) -> Area 5000 (minus the horizontal segment piece? No, horizontal is from 20 to 80).
// Wait. 
// If H-seg is at y=50, from x=20 to x=80.
// If V-seg is at x=50, from y=20 to x=80.
// Space x < 50:
//   Blocked by H-seg at y=50 (from x=20 to x=50).
//   So we have Rect A: (0,0)-(50,50) -> 2500? Use (0,0)-(50,100)? No, blocked by H-seg.
//   Rect B: (0,0)-(20, 100) -> 2000.
//   Rect C: (0,0)-(100, 20) -> 2000.
// Actually, let's analyze the 4 quadrants formed by the cross.
// Q1 (top-right): (50,50) to (80,80) are blocked.
// The empty space is "outside" the cross.

// Optimal Rectangles:
// 1. Left of x=20: (0,0)-(20,100) area 2000.
// 2. Right of x=80: (80,0)-(100,100) area 2000.
// 3. Below y=20: (0,0)-(100,20) area 2000.
// 4. Above y=80: (0,80)-(100,100) area 2000.
// 5. The "L" shapes?
//    Rectangle (0,0) to (50, 50)? blocked by nothing? 
//    Wait. (0,0) to (50,50). 
//    H-seg is y=50, x in [20,80]. So top edge of rect at y=50 hits segment at x>=20.
//    So (0,0)-(50,50) intersects H-segment at (20,50)-(50,50). INVALID.
//    Valid rect in bottom-left: (0,0)-(50,50) is invalid.
//    Max rect in bottom-left limited by x=20 OR y=50.
//    - (0,0)-(20,50) -> 1000.
//    - (0,0)-(50,20) -> 1000.
//    - (0,0)-(20,100) -> 2000.

// Is there a 5000 solution?
// The test says "approx 5000" for ONE POINT.
// For CROSS, the test expects > 1990.
// User says "Bug with Cross shape".
// Maybe the user EXPECTS 2500 but gets less? 
// Or maybe the user *thinks* they should get something larger?
// Or maybe the solver crashes?

// Let's run it and see what we get and DRAW it (mentally) from the coordinates.

const obs: Segment[] = [
    new Segment({ x: 20, y: 50 }, { x: 80, y: 50 }), // Horizontal
    new Segment({ x: 50, y: 20 }, { x: 50, y: 80 })  // Vertical
];

console.log("Running Cross Shape Debug...");
const res = solveSegments(obs, bounds);
console.log(`Result Area: ${rectArea(res)}`);
console.log(`Result Rect: x=${res.x}, y=${res.y}, w=${res.width}, h=${res.height}`);

// Check validity
let valid = true;
// Simple intersection check
for (const s of obs) {
    // bounding box overlap check, good enough for axis-aligned Seg vs Rect
    // We'll trust the verify logic later, just printing for now.
}
