# MER Visualization Tool Specification

## Overview
A web-based interactive tool to visualize, debug, and demonstrate the Maximum Empty Rectangle (MER) algorithm. This tool will allow users to define obstacles on a 2D plane and view the calculated largest empty rectangle in real-time.

## Goals
1.  **Visual Debugging**: Provide a visual interface to verify known failure cases (e.g., U-Shape, Collinear).
2.  **Interactivity**: Allow dynamic placement and modification of obstacles to test edge cases efficiently.
3.  **Demonstration**: Showcase the algorithm's performance and correctness on random or preset layouts.

## Features

### 1. Canvas Board
-   **Drawing Area**: A responsive HTML5 Canvas representing the bounding box (e.g., 100x100 coordinate system scaled to view).
-   **Obstacle Rendering**: Draw obstacles as line segments or rectangles (black).
-   **Result Rendering**: Highlight the calculated Maximum Empty Rectangle (green/transparent overlay) and the optimal empty point (if helpful).

### 2. Controls
-   **Add Obstacle**:
    -   Click-and-drag to create line segments.
    -   Input fields for precise coordinate entry.
-   **Presets**: Buttons to load standard test cases:
    -   U-Shape
    -   Cross
    -   Staircase
    -   Grid Pattern
    -   Random Fuzzy (Isothetic)
-   **Actions**:
    -   "Solve": Run `MerSolver` and update the view.
    -   "Clear": Reset the board.
    -   "Randomize": Generate N random obstacles.

### 3. Debug Overlay
-   **Staircase Visualization** (Optional): Toggle to show the "staircase" boundaries constructed by the algorithm during the divide-and-conquer steps.
-   **Metrics**: Display execution time and the area of the found rectangle.

## Technical Architecture

### Stack
-   **Framework**: Vanilla TypeScript with Vite (for fast dev server).
-   **Graphics**: HTML5 Canvas API (efficient for simple 2D geometry).
-   **Language**: TypeScript (sharing core logic from `src/`).

### Directory Structure
```
/visualization
  /index.html      # Entry point
  /main.ts         # Visualization logic
  /renderer.ts     # Canvas drawing helpers
  /state.ts        # State management (obstacles, bounds)
  /vite.config.ts  # Build config (alias src/ imports)
```

### Integration
-   Directly import `MerSolver` and geometry types from `../src/mer_solver` and `../src/geometry`.
-   Ensure `tsconfig.json` allows including files outside root if necessary, or configure Vite aliases.

## Implementation Steps

### Phase 1: Setup
-   Initialize Vite project in `visualization/`.
-   Configure TypeScript path mappings to access `../src`.
-   Set up basic HTML layout.

### Phase 2: Core Rendering
-   Implement `Renderer` class to draw grid, obstacles (Segments), and Rectangles.
-   Implement coordinate mapping (Logic Space [0,100] <-> Screen Space positions).

### Phase 3: Interaction & Solver
-   Add mouse event listeners for adding obstacles.
-   Wire up the `Solve` button to instantiate `MerSolver` and run `solve()`.
-   Display the resulting `Rectangle`.

### Phase 4: Presets & Polish
-   Implement buttons to load U-Shape, Cross, etc.
-   Add styling (CSS) for a clean UI.
