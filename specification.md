# Maximum Empty Rectangle (MER) Algorithm Specification

**Reference**: Nandy, S. C., Sinha, A., & Bhattacharya, B. B. (1994). *Location of the Largest Empty Rectangle among Arbitrary Obstacles*. [[DOI]](https://doi.org/10.1007/3-540-58715-2_122)

## 1. Problem Definition
Given a rectangular floor $R$ and a set of $n$ **arbitrary** line segments (obstacles/sticks) $S = \{s_1, s_2, ..., s_n\}$ entirely within $R$, determine the isothetic (axis-aligned) rectangle $r \subseteq R$ of maximum area such that the interior of $r$ does not intersect any obstacle in $S$.

## 2. Theoretical Foundations

### 2.1 Key Definitions
*   **Maximal Empty Rectangle (MER)**: An empty rectangle not properly contained in any other empty rectangle. It supports itself against obstacles on all four sides.
*   **Support**: A stick touching the boundary of the MER.
    *   **Fixed Support**: Contact is on the side of the rectangle (fixes the coordinate).
    *   **Flexible Support**: Contact is at a corner of the rectangle (allows sliding).
*   **Prime Maximal Empty Rectangle (PMER)**: An MER with at least one corner supported by a "flexible support" (endpoint of a stick or a generic point on a slanted stick). The global maximum is always a PMER.

### 2.2 The "Staircase" (Stair)
For a central point $c^*$, the free space in each quadrant is bounded by a **Maximal Empty Stair**.
*   **Definition**: A monotonic chain of obstacle segments (lower/upper envelopes) defining the boundary of empty space associated with a specific quadrant relative to the center.
*   **Orthoconvex Polygon**: The union of the 4 stairs ($S^*_1, S^*_2, S^*_3, S^*_4$) forms an empty orthoconvex polygon containing $c^*$. The search for the MER enclosing $c^*$ is restricted to this polygon.

### 2.3 Quadratic Maximization
When a rectangle's corner slides along a non-isothetic (slanted) obstacle (Flexible Support), its area is a quadratic function of the contact position.
*   **Formula**: Area $A(\alpha) = (X_2(\alpha) - X_1(\alpha))(Y_1(\alpha) - Y_2(\alpha))$.
*   **Optimization**: Since the area function is piecewise quadratic, the maximum occurs either at the boundaries of the sliding interval (endpoints/intersections) or where the derivative $A'(\alpha) = 0$.

## 3. Algorithm Description ($O(n \log^2 n)$)

### 3.1 Divide-and-Conquer
1.  **Divide**: Partition Window $W$ by a cut line (Vertical $VP$ or Horizontal $HP$) at the median coordinate.
2.  **Conquer**: Recursively solve for the two halves.
3.  **Merge**: Solve the **Crossing MER** problem. The Max Area is $\max(Area_{left}, Area_{right}, Area_{crossing})$.

### 3.2 The Crossing MER Problem ("solveCentral")
To find the MER crossing the dividing line (say, Vertical $VP$):
1.  **Sub-split**: Introduce a Horizontal cut $PH$ at the median y-coordinate on $VP$. Intersection is $c^*$.
2.  **Cases**:
    *   (i) MER contains $c^*$.
    *   (ii) MER crosses $VP$ but is above $PH$.
    *   (iii) MER crosses $VP$ but is below $PH$.
3.  **Solving Case (i) (Containing $c^*$):**
    *   **Staircase Construction**: Compute 4 Maximal Empty Stairs ($S^*_1, S^*_2, S^*_3, S^*_4$) originating from $c^*$.
        *   $S^*_1$ (TR), $S^*_2$ (TL), $S^*_3$ (BL), $S^*_4$ (BR).
    *   **Matrix Search**: The problem reduces to finding optimal corners on these stairs. The area maximization can be modeled as searching for the maximum entry in a matrix $M$ where $M_{ij}$ is the area formed by interacting steps $i$ (from $S^*_2$) and $j$ (from $S^*_4$).
    *   **Total Monotonicity**: The matrix $M$ satisfies the *totally monotone* property (or can be decomposed into such matrices), allowing the maximum to be found in $O(n)$ time using the SMAWK algorithm (or simple linear scan if simplified).

## 4. Implementation Specifications

### 4.1 Architecture
*   **Language**: TypeScript (Strict Mode).
*   **Data Structures**:
    *   `Stair`: Interval-tree or Array-based storage of segments representing the staircase.
    *   `Segment`: Geometric primitive.
    *   `PMER`: Candidate rectangle structure.

### 4.2 Solver Details
*   **Explicit Stack**: Use coordinate splitting to avoid recursion depth issues.
*   **Corner Handling**: Critically, the solver must handle "Flexible Supports" where the optimal rectangle corner touches an obstacle vertex or slides along a slanted line, not just "Fixed Supports" (grid alignment).

### 4.3 Constraint Handling
The solver uses unique strategies for different segment types to ensure robustness:
*   **Arbitrary Sloped Segments**: Processed by clipping to the quadrant bounds.
*   **Horizontal Segments**: Converted into **Proxy Vertical Constraints**. A horizontal segment effectively creates a "wall" at its nearest endpoint (relative to the quadrant origin). The solver synthesizes a vertical segment at this "Effective X" with the same Y-range, ensuring correct clipping without complex horizontal interval logic.
*   **Vertical Segments**: Explicitly handled to avoid infinite slope calculations (`dx = 0`).
