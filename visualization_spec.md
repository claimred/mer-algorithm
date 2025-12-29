# MER Visualization Tool Specification

## Overview
A web-based interactive tool to visualize, debug, and demonstrate the Maximum Empty Rectangle (MER) algorithm. This tool allows users to define obstacles on a 2D plane and view the calculated largest empty rectangle in real-time.

> [!IMPORTANT]
> **Primary Goal**: The tool must provide deep insight into the algorithm's execution, not just the final result. Visualizing the "Divide & Conquer" steps and "Staircase" construction is critical for debugging.

## Features

### 1. Canvas Board
-   **Drawing Area**: A responsive HTML5 Canvas representing the logical coordinate system (default 100x100), mapped to the screen size while maintaining aspect ratio.
-   **Coordinate System**: 
    -   Standard Cartesian Logic: `(0,0)` at bottom-left.
    -   Visual Feedback: Display current mouse logical coordinates `(x, y)` in the UI.
-   **Obstacle Rendering**: 
    -   Draw obstacles as black line segments with visible endpoints.
    -   **Hover Effect**: Highlight segment and show coordinates when mouse enters detection radius.

### 2. Algorithm Visualization (New)
The visualization must support inspecting the *internal state* of the `MerSolver`.

-   **Step-by-Step Mode**:
    -   Convert the recursive solver into a Generator or State Machine to yield intermediate states.
    -   **Controls**: `Next Step`, `Play` (with speed control), `Pause`, `Reset`.
-   **Visual Elements**:
    -   **Active Window**: Highlight the current rectangular region (sub-problem) being processed (e.g., dashed blue border).
    -   **Split Line**: Draw the Vertical (`VP`) or Horizontal (`HP`) cut line chosen for the current step (e.g., dashed red line).
    -   **Staircases**: When solving the "Central" interactions, visualize the 4 directional staircases (`Q1`..`Q4`) as shaded polygons or stepped lines.
    -   **Candidate Rectangles**: Briefly flash candidate rectangles as they are evaluated.

### 3. Controls & Interactivity
-   **Input Methods**:
    -   **Drag-to-Draw**: Left-click and drag to create line segments.
    -   **Precision Input**: Manual entry form for specific `(x1, y1) -> (x2, y2)` coordinates.
-   **Presets**:
    -   `U-Shape`: Loads the failure case for heuristic splitters.
    -   `Cross`: Tests central interaction.
    -   `Grid`, `Staircase`, `Random`: Standard stress tests.
-   **Actions**:
    -   `Solve`: Instant execution (Black Box mode).
    -   `Debug Run`: Step-by-step execution (White Box mode).
    -   `Clear`: Reset board.

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

## Implementation Roadmap

### Phase 1: Core (Completed)
-   [x] Basic Vite setup.
-   [x] Canvas `Renderer` with Coordinate mapping.
-   [x] Basic `State` management.
-   [x] Drag-to-draw interaction.
-   [x] Synchronous `Solve` integration.

### Phase 2: Enhanced Logic & UI (Current)
-   [ ] Implement specific Presets (U-Shape is partially done, verify correctness).
-   [ ] Add Manual Coordinate Input for precise testing.
-   [ ] Add "Hover" inspection for existing segments.

### Phase 3: Advanced Visualization (Next)
-   [ ] Refactor `MerSolver` (or create `DebugSolver`) to support execution hooks/listeners.
-   [ ] Implement "Snapshot" recording during solve.
-   [ ] Build "Playback" UI (Slider/Buttons) to scrub through solver history.
-   [ ] Render "Split Lines" and "Active Windows" based on snapshots.
