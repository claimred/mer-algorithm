# Maximum Empty Rectangle (MER) in TypeScript

This project implements the algorithm for finding the **Maximum Empty Isothetic Rectangle** (MER) amidst a set of **Arbitrary Obstacles** (line segments) in a 2D plane.

Based on the paper:
*Location of the Largest Empty Rectangle among Arbitrary Obstacles* - S. C. Nandy, A. Sinha, B. B. Bhattacharya (1994).

## Documentation

*   [Algorithm Specification](./specification.md): Detailed algorithm description to Nandy 1994.
*   [Visualization Specification](./visualization_spec.md): UI and Feature specs for the visualizer.
*   [Developer & Agent Guide](./AGENTS.md): Internal implementation details.
*   [Tasks & Roadmap](./TASKS.md): Project roadmap and TODOs.

## Features

*   **Arbitrary Obstacles**: Supports any oriented line segments (diagonals, polygons).
*   **Coordinate Splitting D&C**: Efficient $O(n \log^2 n)$ divide-and-conquer strategy.
*   **TypeScript Implementation**: Fully typed and modular.
*   **Optimization**: Uses staircase constraint envelopes.

## Contributing

We follow a strict **Feature Branch Workflow**.
1.  Create a GitHub Issue.
2.  Create a branch (`feature/...` or `fix/...`).
3.  **Never commit to main**.
4.  Run `npm test` and `npm run build` (in `visualization/`).
5.  Submit a Pull Request.

## Usage

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Tests**:
    ```bash
    npm test
    ```

3.  **Run Arbitrary Obstacle Debug**:
    ```bash
    npx tsx debug_arbitrary.ts
    ```

## Visualization
 
 A web-based visualizer is available to interactively test and debug the algorithm.
 
 1.  **Navigate to directory**:
     ```bash
     cd visualization
     ```
 2.  **Run Development Server**:
     ```bash
     npm run dev
     ```
 
 See [visualization/README.md](./visualization/README.md) for more details.
 
 ## Project Structure

*   `src/`: Source code
    *   `mer_solver.ts`: Main D&C solver (Coordinate Splitting)
    *   `staircase.ts`: "Stair" data structure for quadrant constraints
    *   `geometry.ts`: Geometric primitives (Segment, Point, maximizeQuadratic)
*   `tests/`: Vitest test suite