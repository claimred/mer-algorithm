# Maximum Empty Rectangle (MER) Algorithm Specification

**Reference**: Nandy, S. C., Sinha, A., & Bhattacharya, B. B. (1994). *Location of the Largest Empty Rectangle among Arbitrary Obstacles*.

## 1. Problem Definition
Given a rectangular floor $R$ and a set of $n$ **arbitrary** line segments (obstacles) $S = \{s_1, s_2, ..., s_n\}$ entirely within $R$, determine the isothetic (axis-aligned) rectangle $r \subseteq R$ of maximum area such that the interior of $r$ does not intersect any obstacle in $S$.

## 2. Theoretical Foundations

### 2.1 The "Staircase" (Stair)
For a central point $c^*$, the free space in each quadrant is bounded by a **Maximal Empty Stair**.
*   **Definition**: A monotonic chain of obstacle segments (lower/upper envelopes) defining the boundary of empty space associated with a specific quadrant relative to the center.
*   **Property**: The union of the 4 stairs forms the search area for crossing rectangles.

### 2.2 Quadratic Maximization
The area of a candidate rectangle formed by two stairs (e.g., in Quadrant 1 and Quadrant 3) can be expressed as a function of $y_{top}$ and $y_{bot}$. Since constraints are forming "steps" (piecewise linear), the area function is piecewise quadratic.

## 3. Algorithm Description ($O(n \log^2 n)$)

### 3.1 Divide-and-Conquer
1.  **Divide**: Given a **Window $W$** (rectangular floor region), partition it by a cut line (Vertical or Horizontal) chosen at the **Median Coordinate** of the obstacle endpoints within $W$.
2.  **Conquer**: Recursively solve Left and Right (or Top and Bottom) halves.
3.  **Merge**: Solve the **Crossing MER** problem.

### 3.2 The Crossing MER Problem ("solveCentral")
1.  **Staircase Construction**: Compute the 4 Maximal Empty Stairs ($S_1, S_2, S_3, S_4$) originating from the center $O$.
    *   $S_1$ (TR): Min X for $y > O_y$
    *   $S_2$ (TL): Max X for $y > O_y$
    *   $S_3$ (BL): Max X for $y < O_y$
    *   $S_4$ (BR): Min X for $y < O_y$
2.  **Interaction Solving**: Find optimal $y_{top}, y_{bot}$ such that $Area = (min(S_1(y_t), S_4(y_b)) - max(S_2(y_t), S_3(y_b))) \times (y_t - y_b)$ is maximized.

## 4. Implementation Specifications

### 4.1 Architecture
*   **Language**: TypeScript (Strict Mode).
*   **Data Structures**:
    *   `Stair`: Interval-based storage of segments. `getX(y)` returns constraint value.
    *   `Segment`: Basic geometric primitive.

### 4.2 Solver
The `MerSolver` uses an **Explicit Stack** with Coordinate Splitting to ensure balanced recursion trees and avoid stack overflow.
