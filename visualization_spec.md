# MER Visualization Tool Specification

## Overview
A web-based interactive tool to visualize, debug, and demonstrate the Maximum Empty Rectangle (MER) algorithm. This tool allows users to define obstacles on a 2D plane and view the calculated largest empty rectangle in real-time.

> [!IMPORTANT]
> **Primary Goal**: The tool must provide deep insight into the algorithm's execution, not just the final result. Visualizing the "Divide & Conquer" steps and "Staircase" construction is critical for debugging.

## Features

### 1. Canvas Board
-   **Full Window Layout**: The canvas maximizes to fill the entire browser window (responsive).
-   **Dynamic Scaling**: The renderer adjusts scale to fit the vertical dimension (0..100 logical units) while expanding horizontally to match the screen aspect ratio.
-   **Coordinate System**: Standard Cartesian (0,0 at bottom-left).
-   **Obstacle Rendering**: Black line segments with visible endpoints.

### 2. Algorithm Visualization (Implemented)
The tool visualizes the `MerSolver` execution using a Generator-based approach.

-   **Step-by-Step Mode**:
    -   **Generator API**: The solver yields `SolverStep` objects (`SPLIT_VP`, `SPLIT_HP`, `SOLVE_CENTRAL`) interacting with the UI loop.
    -   **Controls**: `Start Debug`, `Next`, `Play`, `Stop`.
-   **Visual Elements**:
    -   **Active Window**: Dashed blue rectangle showing the current sub-problem bounds.
    -   **Split Line**: Dashed red line showing the Vertical or Horizontal cut.
    -   **Result**: Semi-transparent green rectangle for the MER found so far.

### 3. Controls & Interactivity
-   **Input Methods**:
    -   **Drag-to-Draw**: Left-click and drag to create segments.
-   **Presets**:
    -   `U-Shape`: Standard heuristic failure case.
    -   `Cross`: Central interaction test.
    -   `Random`: Random set of arbitrary segments (any orientation).
-   **Actions**:
    -   `Solve`: Runs the algorithm instantly.
    -   `Clear`: Resets the board.
    -   `Debug`: Enters step-by-step mode.

### 4. Metrics & Feedback
-   **Performance**: Execution time in milliseconds (performance.now).
-   **Result**: 
    -   Max Area value.
    -   Defining Rectangle coordinates `[x, y, w, h]`.
-   **Visual Result**: 
    -   Draw the Maximum Empty Rectangle in semi-transparent green (`rgba(0, 255, 0, 0.3)`) with a solid border.
    -   If standard presets fail, overlay the *expected* result (if known) in red for comparison.

## Technical Architecture

### Stack
-   **Engine**: Vanilla TypeScript with Vite.
-   **Renderer**: Canvas API 2D. 
-   **State Management**: Centralized `State` class holding geometry and solver configuration.

### Directory Structure
```
/visualization
  /src
    /main.ts         # App entry, UI wiring
    /Renderer.ts     # Canvas abstraction (Screen <-> Logic mapping)
    /State.ts        # App state (obstacles, results, debug_steps)
    /SolverRunner.ts # Wrapper to run MerSolver in sync or async/generator mode
    /style.css       # Layout and UI styling
  /index.html
```

### Integration Strategy
-   **Shared Logic**: Import core algorithm directly from `../src/`.
-   **Async Refactor**: To support step-by-step, the `MerSolver` might need a `yield` generic or a callback hook. Alternatively, pass a `DebugListener` interface to the solver that can record snapshots of the process.

## Implementation Status

### Completed Features
-   [x] Basic Vite setup & Canvas Renderer.
-   [x] Full Window / Responsive Layout.
-   [x] Drag-to-draw interaction.
-   [x] Generator-based Step-by-Step Debugging.
-   [x] Presets (U-Shape, Cross, Random).
-   [x] Synchronous Solve.

### Future Improvements
-   [ ] **Staircase Visualization**: Visualize the internal "Stair" data structures during the central solve step.
-   [ ] **Manual Coordinate Input**: Form for precise segment entry.
-   [ ] **Hover Inspection**: Inspect segment coordinates on hover.
-   [ ] **Playback Slider**: Scrub through history.
