import { MerSolver } from './src/mer_solver';
import { Segment, Rectangle, rectArea } from './src/geometry';

const solver = new MerSolver();
const bounds: Rectangle = { x_min: 0, y_min: 0, x_max: 100, y_max: 100 };

const obs: Segment[] = [
    { p1: { x: 20, y: 50 }, p2: { x: 80, y: 50 } },
    { p1: { x: 50, y: 20 }, p2: { x: 50, y: 80 } }
];

console.log('=== Cross Shape Deep Debug ===');
console.log('Obstacles:', JSON.stringify(obs));
console.log('');

// The optimal MER should be one of the four corners:
// Bottom-Left: [0,0] - [20,50] = 20*50 = 1000 (blocked by horizontal at (20,50))
// Bottom-Left corner: [0,0] - [50,50] = 50*50 = 2500 (blocked by both segments at corner)
// Actually, the correct corner should avoid both obstacles:
// Top-Left: [0,50] - [20,100] = 20*50 = 1000
// OR the largest: [0,0] - [20,50] = 1000, [0,50] - [20,100] = 1000, etc.

// Wait, let me re-analyze:
// Horizontal segment: (20,50) - (80,50)
// Vertical segment: (50,20) - (50,80)
// 
// The four corner rectangles avoiding BOTH obstacles:
// Bottom-Left: [0,0] - [20,20] - but obstacle is at y=50, so [0,0]-[20,50] is blocked by the corner intersection
// Actually:
// Top-Left corner empty: [0,50] to [20,100] - blocked by horizontal starting at x=20
// Best option: [0,0] to [50,50] - blocked at (50,50) and along y=50 from x=20

// Actually, any rectangle containing the center (50,50) or crossing y=50 between x=20-80 
// or crossing x=50 between y=20-80 is blocked.

// Largest empty rectangle options:
// 1. [0,0] to [20,50] = 1000 (edge touches horizontal segment start at (20,50))
// 2. [0,0] to [50,20] = 1000 (edge touches vertical segment start at (50,20))
// 3. [0,50] to [20,100] = 1000
// 4. [80,0] to [100,50] = 1000
// etc.

// WAIT - the expected area in the test is 2500. Let me reconsider.
// If boundary touching is allowed (MER can touch but not cross obstacles),
// then [0,0] - [50,50] = 2500 is valid if the obstacle at (50,50) only blocks interior.

console.log('Expected: One of the corner rectangles with area ~2500');
console.log('The optimal corner rectangle should be [0,0]-[50,50] or similar = 2500');

const res = solver.solve(bounds, obs);

console.log('');
console.log('Result Rectangle:', JSON.stringify(res));
console.log('Result Area:', rectArea(res));

// Check if the four corners each produce valid empty rectangles
const corners = [
    { x_min: 0, y_min: 0, x_max: 50, y_max: 50 },
    { x_min: 0, y_min: 50, x_max: 50, y_max: 100 },
    { x_min: 50, y_min: 0, x_max: 100, y_max: 50 },
    { x_min: 50, y_min: 50, x_max: 100, y_max: 100 }
];

console.log('');
console.log('Corner rectangle areas (all should be 2500):');
for (const c of corners) {
    console.log(`  [${c.x_min},${c.y_min}]-[${c.x_max},${c.y_max}] = ${rectArea(c)}`);
}
