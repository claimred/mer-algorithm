# MER Visualization Tool

A web-based visualizer for the Maximum Empty Rectangle algorithm.

## Features

- **Draw Obstacles**: Drag to draw line segments.
- **Presets**: Load U-Shape, Cross, or Random obstacles.
- **Step-by-Step Debugging**: Visualizes the Divide & Conquer process (Split Lines, Active Windows).
- **Controls**: Play, Pause, Next Step.

## Setup

1.  **Install Dependencies**:
    ```bash
    cd visualization
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open the prompted URL (usually `http://localhost:5173/`).

## Deployment

This project uses `gh-pages` to deploy to GitHub Pages.

1.  **Build and Deploy**:
    ```bash
    npm run deploy
    ```
    This command builds the project and pushes the `dist` folder to the `gh-pages` branch.

## Architecture

-   **Renderer**: HTML5 Canvas rendering logic (`src/Renderer.ts`).
-   **State**: Manages obstacles and solver interactions (`src/State.ts`).
-   **Solver**: Reuse of the core algorithm from `../src/mer_solver.ts`.
