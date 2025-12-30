# Feature: Advanced Presets

## Goal
Provide a set of complex, pre-defined obstacle configurations to demonstrate the algorithm's capabilities and stress-test its performance.

## Usage
- **Interaction**: One-click activation. Clicking a preset button clears the current board and loads the preset.
- **Configuration**: Fixed size/parameters relative to the current canvas bounds (e.g., "Comb takes up 80% width").

## Preset Definitions

### 1. Comb
- **Description**: Interleaving vertical bars from top and bottom.
- **Purpose**: Tests behavior in narrow corridors and local minima.
- **Shape**:
  - Vertical segments alternating from `y=0` to `y=0.8*h` and `y=1` to `y=0.2*h`.

### 2. Spiral
- **Description**: A square spiral winding inwards.
- **Purpose**: Tests solving in a long, continuous winding corridor.
- **Shape**:
  - Segments forming a spiral with ~5 turns.

### 3. Maze
- **Description**: A random-like but structured maze pattern or a recursive division grid.
- **Purpose**: Visual appeal and general complexity.
- **Shape**:
  - Grid-based wall segments with random gaps.

### 4. Worst-case Staircase
- **Description**: A strictly monotonic step pattern (like a staircase).
- **Purpose**: Tests the core "staircase" logic usage in `mer_solver`.
- **Shape**:
  - Steps scaling from (0,h) to (w,0).

### 5. Dense Random Cluster
- **Description**: High density of small custom segments in the center.
- **Purpose**: Performance stress test (N=50+).
- **Shape**:
  - 50 segments randomly placed in the central 50% area.

### 6. Star
- **Description**: Several lines radiating from a center point.
- **Purpose**: Tests angular constraints and "Flexible Support" logic.
- **Shape**:
  - 8-16 segments sharing a common start point (center) and radiating outwards.

## UI Specification
- **Location**: "Presets" section in sidebar.
- **Elements**: 
  - Button Grid (2 columns).
  - Icons: Use simple CSS/SVG icons or Emoji (e.g., 🦷, 🌀, 🧩, 📉, 🎇) if appropriate, or just text labels if icons are too complex to implement initially.
- **Labels**: Tooltips explaining the shape.
