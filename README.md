# Maximum Empty Rectangle (MER) in TypeScript

This project implements the $O(n \log^2 n)$ algorithm for finding the Maximum Empty Rectangle (MER) amidst a set of isothetic obstacles (points/segments) in a 2D plane, based on the paper by Nandy, Bhattacharya, and Ray (1994).

## Features

*   **TypeScript Implementation**: Fully typed implementation of the MER algorithm.
*   **Divide & Conquer**: Uses an efficient recursive strategy with median partitioning.
*   **SMAWK Algorithm**: Implements `monotoneMax` matrix search for $O(n)$ step processing.
*   **Visualization**: (Upcoming) HTML5 Canvas visualizer.

## Usage

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Tests**:
    ```bash
    npm test
    ```

3.  **Run Development/Debug Scripts**:
    ```bash
    npx tsx debug_cross.ts
    ```

## Project Structure

*   `src/`: Source code
    *   `mer_solver.ts`: Main algorithm logic
    *   `geometry.ts`: Geometric primitives (Point, Segment, Rectangle)
    *   `matrix_search.ts`: Monotone matrix search utility
    *   `staircase.ts`: Data structures for staircase boundaries
*   `tests/`: Vitest test suite

## Documentation

*   [Algorithm Specification](./specification.md): Detailed algorithm description and theoretical background.
*   [Visualization Tool Specification](./visualization_spec.md): Plans for the upcoming web-based visualizer.

