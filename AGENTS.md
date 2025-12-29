# AGENTS.md - Developer & Agent Guide

## Project Context
This repository implements the **Maximum Empty Rectangle (MER)** algorithm for a set of **Arbitrary Line Segment Obstacles** in a 2D plane. The implementation is based on the algorithm described by Nandy, Sinha, and Bhattacharya (1994).

## Technology Stack
-   **Language**: TypeScript
-   **Runtime**: Node.js (via `tsx`)
-   **Testing**: Vitest (`npm test`)
-   **Visualization**: Vanilla TypeScript/Vite in `visualization/` (Implemented)

## Key Invariants & Constraints
1.  **Arbitrary Obstacles**: The algorithm supports any line segment.
2.  **Floating Point Precision**:
    *   All coordinates are `number` (IEEE 754 doubles).
    *   Comparisons **MUST** use `EPS = 1e-9`.
3.  **Coordinate System**: Standard Cartesian.

## Core Architecture
### `src/mer_solver.ts`
The heart of the system.
-   **`MerSolver` Class**: Encapsulates solver state.
-   **`solveGenerator(...)`**: Generator-based implementation for **Step-by-Step Execution**. Yields `SolverStep` objects (SPLIT_VP, SPLIT_HP, etc.).
-   **`solveSegments`**: Backward-compatible synchronous wrapper.
-   **`solveCentral(...)`**: Solves the "Crossing MER" problem using Maximal Empty Stairs.

### `src/staircase.ts`
-   **`Stair`**: Represents the monotonic boundary of empty space in a quadrant. Supports `getMinX` / `getMaxX` queries.
-   **`StairBuilder`**: Helper to construct Stairs by merging constraint intervals.

### `src/geometry.ts`
-   **`Segment`**: Enhanced class with `slope`, `intercept`, `getX(y)`.
-   **`maximizeQuadratic`**: Utility for determining Optimal 1-sided rectangle.

## Development Workflow

### 1. Verification
**CRITICAL**: You MUST run the full test suite after EVERY change to ensure no regressions.
```bash
npm test
```
This runs `tests/mer.test.ts`.

Also run the arbitrary obstacle debug script:
```bash
npx tsx debug_arbitrary.ts
```

### 2. Debugging
Use `debug_arbitrary.ts` for specific geometric scenarios (Diagonal, Diamond, etc.).

## Future Work
-   **Optimization**: `solveStairInteractions` uses **Monotone Matrix Search (SMAWK)** for $O(n)$ speed per merge.

