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
**CRITICAL**: All changes must follow this exact process to maintain code quality and history.

### 1. Workflow Protocol
1.  **Issue Creation**:
    -   Identify the task (bug or feature).
    -   Create a GitHub Issue with a detailed description.
    -   **Extensive Documentation Required**: The Issue body must include:
        *   **Problem Description**: What is the issue?
        *   **Context**: Why is this important?
        *   **Reproduction Steps**: How to trigger the bug (for bugs).
        *   **Success Criteria**: Definition of done.

2.  **Branching**:
    -   **NEVER commit to `main` directly.**
    -   Create a feature/fix branch from `main`:
        ```bash
        git checkout -b feature/my-cool-feature
        # or
        git checkout -b fix/issue-description
        ```

3.  **Implementation & Comparison**:
    -   Make your changes.
    -   **Run Tests**: You must run ALL tests (Algo & Vis) before PR.
        ```bash
        npm test        # Logic tests
        cd visualization && npm run build # Visualizer build check
        ```

4.  **Pull Request**:
    -   Create a PR from your branch to `main`.
    -   **Extensive Documentation Required**: The PR body must include:
        *   **Summary**: High-level overview of changes.
        *   **Implementation Details**: Specifics of what was modified and why.
        *   **Test Plan**: Exact commands run to verify.
        *   **Verification Results**: Evidence (logs, screenshots) proving correctness.
    -   Link the relevant Issue.
    -   Wait for approval.

5.  **Merge**:
    -   Rebase on `main` if needed to keep history semi-linear.
    -   Merge only after all checks pass.

### 2. Debugging
-   **Directory**: All debug scripts (e.g., `debug_*.ts`, `trace_*.ts`, `test_*.ts`) **MUST** be created in the `debug/` directory.
-   **Git**: Do not commit experimental debug scripts to the repository root.

### 3. Coding Standards
-   **Small Functions**: Avoid large monolithic functions. Break logic into small, composable, and testable helpers (e.g., `handleHorizontalSegment`).
-   **TSDoc**: All exported classes, interfaces, and public methods **MUST** have TSDoc comments explaining their purpose, parameters, and return values.
-   **Dead Code**: Unused code (functions, variables) must be removed immediately. Do not comment out code.

## Future Work
-   **Optimization**: `solveStairInteractions` uses **Monotone Matrix Search (SMAWK)** for $O(n)$ speed per merge.

## Component Deep Dive

### StairBuilder & Constraints
The `StairBuilder` constructs the "Staircase" (monotonic boundary) for a quadrant by merging **Constraints**.
-   **Input**: A set of segments and a specific quadrant context (e.g., Quadrant 1, minimizing X).
-   **Logic**:
    -   Iterates through segments.
    -   Clips them to the quadrant's operational bounds.
    -   **Critical**: For **Horizontal Segments**, it calculates the "Effective X" (intersection with quadrant bounds) and creates a proxy vertical constraint. This prevents the "missing wall" bug where a horizontal segment returning `max(x)` is ignored because its endpoints are outside, even though it spans the view.
    -   Merges overlapping constraints to keep the "most restrictive" one (e.g., smallest X if minimizing).

### MER Solver Phases
1.  **Divide**: Coordinate Split (Median X or Y).
2.  **Conquer**: Recursively solve sub-rectangles.
3.  **Merge (Crossing)**:
    -   Build 4 Stairs from the split point.
    -   Intersect ranges of Top (Q1, Q2) and Bottom (Q3, Q4) stairs.
    -   Use **Monotone Matrix Search** to find the best pairing of Top/Bottom intervals in linear time.

## Test Suite Reference (`tests/mer.test.ts`)

| Case Name | Shape | Purpose |
| :--- | :--- | :--- |
| **One Point** | Single Point at (50,50) | Verifies basic splitting behavior. Expected max area 5000. |
| **Cross Shape** | + Shape | Tests handling of orthogonal crossing barriers. |
| **U-Shape** | U opening Up | **Critical**: Tests constraints that "wrap" around the center or horizontal segments crossing the vertical cut. The "Bottom" of the U acts as a horizontal barrier. |
| **Diamond** | Rotated Square | Tests diagonal segment handling and "sloped" constraints. |
| **Nearly Vertical** | (50,0)->(50.0...1,100) | Tests numerical stability for steep slopes. |


