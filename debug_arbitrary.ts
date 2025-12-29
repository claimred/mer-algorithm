
console.log("Starting debug_arbitrary.ts");
try {
    const solver = require('./src/mer_solver');
    const geometry = require('./src/geometry');
    const { solveSegments } = solver;
    const { Rectangle, Segment, rectArea } = geometry;

    const floor = { x: 0, y: 0, width: 100, height: 100 };
    const segments = [
        new Segment({ x: 0, y: 0 }, { x: 100, y: 100 }), // Main diagonal
        new Segment({ x: 0, y: 0 }, { x: 100, y: 0 }),
        new Segment({ x: 100, y: 0 }, { x: 100, y: 100 }),
        new Segment({ x: 100, y: 100 }, { x: 0, y: 100 }),
        new Segment({ x: 0, y: 100 }, { x: 0, y: 0 })
    ];

    console.log("Running solver on diagonal segment...");
    const result = solveSegments(segments, floor);

    console.log("Result:", result);
    console.log("Area:", rectArea(result));

    if (Math.abs(rectArea(result) - 2500) < 1) {
        console.log("SUCCESS");
    } else {
        console.log("FAILURE");
    }
} catch (e) {
    console.error("Error:", e);
}
