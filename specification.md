# Maximum Empty Rectangle (MER) Algorithm Specification

**Reference**: Nandy, S. C., Bhattacharya, B. B., & Ray, S. (1994). *Location of the Largest Empty Rectangle among Arbitrary Obstacles*.

## 1. Problem Definition
Given a rectangular floor $R$ and a set of $n$ arbitrarily oriented, non-intersecting line segments (obstacles) $S = \{s_1, s_2, ..., s_n\}$ entirely within $R$, determine the isothetic (axis-aligned) rectangle $r \subseteq R$ of maximum area such that the interior of $r$ does not intersect any obstacle in $S$.

## 2. Theoretical Foundations

### 2.1 The "Window" Concept
A **Window** $W$ is a maximal empty convex polygon with at most eight sides, enclosing a Prime Maximal Empty Rectangle (PMER). 
*   **Sides**: 4 isothetic (Horizontal/Vertical) + up to 4 non-isothetic (obstacles).
*   **Property**: Every Window corresponds to ~1 PMER.

### 2.2 The "Staircase" (Stair)
For a central point $c^*$, the free space in each quadrant is bounded by a **Maximal Empty Stair**.
*   **Definition**: A monotonic chain of obstacle segments defining the boundary of empty space associated with a specific quadrant relative to the center.
*   **Orthoconvex Polygon**: The union of the 4 stairs forms the search area for crossing rectangles.

### 2.3 Matrix Search
*   **Matrix**: Rows = Left Stair Steps, Cols = Right Stair Steps.
*   **Property**: The area function is **Totally Monotone**.
*   **Complexity**: $O(\mu + \nu)$ search using SMAWK-like logic.

## 3. Algorithm Description ($O(n \log^2 n)$)

### 3.1 Vertical Divide-and-Conquer
1.  **Divide**: Partition problem by vertical line $VP$ at median X.
2.  **Conquer**: Recursively solve Left and Right halves.
3.  **Merge**: Solve the **Crossing MER** problem.

### 3.2 The Crossing MER Problem
1.  **Horizontal Split**: Partition by horizontal line $HP$ at median Y.
2.  **Central Reduction**: Find the largest PMER containing $c^* = VP \cap HP$.
3.  **Staircase Construction**: Compute the 4 Orthoconvex Stairs.
4.  **Optimization**: Map to Matrix $A$ and run Monotone Max Search.

## 4. Implementation Specifications

### 4.1 Architecture
*   **Language**: TypeScript (Strict Mode).
*   **Environment**: Node.js (Logic/Test), Browser (Visualization).
*   **Components**:
    *   `src/geometry.ts`: Interfaces for `Point`, `Segment`, `Rectangle`.
    *   `src/staircase.ts`: `Staircase` class for monotonic constraints.
    *   `src/matrix_search.ts`: Generic Monotone Matrix searcher.
    *   `src/mer_solver.ts`: Iterative solver using `Job[]` stack (Iterative D&C).

### 4.2 Iterative Solver
The recursive structure is flattened using an explicit stack of `Job` objects:
*   `Job { bounds, obstacles, type (V/H), parentCutX }`
This prevents stack overflow and simplifies state management.
