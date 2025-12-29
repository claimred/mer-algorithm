# AGENTS.md - Developer & Agent Guide

## Project Context
This repository implements the **Maximum Empty Rectangle (MER)** algorithm for a set of isothetic (axis-aligned) obstacles in a 2D plane. The implementation follows the $O(n \log^2 n)$ divide-and-conquer approach described by Nandy, Bhattacharya, and Ray (1994).

## Technology Stack
-   **Language**: TypeScript
-   **Runtime**: Node.js (via `tsx`)
-   **Testing**: Vitest (`npm test`)
-   **Visualization**: (Planned) React/Vite in `visualization/`

## Key Invariants & Constraints
1.  **Isothetic Obstacles Only**: The algorithm is designed for vertical and horizontal line segments.
    *   *Constraint*: Diagonal segments are **not** fully supported. If encountered, they should be treated as their Axis-Aligned Bounding Box (AABB) to ensure correctness (conservative approximation).
2.  **Floating Point Precision**:
    *   All coordinates are `number` (IEEE 754 doubles).
    *   Comparisons **MUST** use `EPS = 1e-9` (e.g., `Math.abs(a - b) < EPS`).
3.  **Coordinate System**: Standard Cartesian. Order of points in specific segments (p1 vs p2) does not strictly matter as the solver normalizes them (sorting min/max), but consistency helps.

## Core Architecture
### `src/mer_solver.ts`
The heart of the system.
-   **`solve(bounds, obstacles)`**: Entry point. Recursively partitions the problem.
-   **`buildCombinedStaircase(...)`**: Constructs the "steps" of available space relative to a central scan line. **Critical complexity lies here.**
    *   *Note*: Handles "crossing segments" (segments that intersect the partition line) by generating blocking events.
-   **`solveCentral(...)`**: Solves the "Crossing MER" problem using the staircase steps and matrix search.

### `src/matrix_search.ts`
-   Implements the **SMAWK**-like `monotoneMax` algorithm to find the optimal rectangle in the matrix defined by left and right staircases in $O(N)$ time.

## Development Workflow

### 1. Verification
Always run the full test suite before committing:
```bash
npm test
```
*   **Fuzzy Test**: Generates random *isothetic* segments to catch edge cases.
*   **U-Shape Test**: A regression test for complex staircase interactions.

### 2. Debugging
Use standalone scripts for isolation. Do not modify source code with permanent logs.
*   Create `debug_repro.ts` for minimal reproduction.
*   Run with: `npx tsx debug_repro.ts`

### 3. Common Pitfalls
-   **Recursion Depth**: For very large $N$, the recursion depth is $O(\log n)$. Stack overflow is unlikely but possible on extreme inputs.
-   **Bounds**: The solver expects a master bounding `Rectangle`. Results are clipped to this rectangle.
-   **Step Generation**: When modifying `buildCombinedStaircase`, ensure events are processed in strict X-order. Events at the exact same X must be batched (Push-Before-Update pattern) to capture the interval correctly.

## Future Work
-   **Arbitrary Orientation**: Support for true diagonal obstacles would require a different algorithm (e.g., using angular sweep or extensive geometry preprocessing), as the current "Staircase" model relies on orthogonal constraints.
