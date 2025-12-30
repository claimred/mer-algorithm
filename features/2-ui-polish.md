# Feature Spec: UI Polishing (Professional CAD Look)

## 1. Goal
Transform the current "developer debug" UI into a polished, professional "CAD-like" interface. This aims to improve usability and visual appeal while maintaining the project's lightweight nature.

## 2. Requirements
*   **Technology**: Vanilla CSS (no frameworks).
*   **Theme**: Light Mode (Clean, professional, high contrast).
*   **Aesthetics**: "Professional CAD" tool.
    *   Precise layout.
    *   Clear, legible typography (Inter/System).
    *   Subtle visual feedback (borders, shadows).
*   **Layout**: Side-docked tool palette (Sidebar) + Main Canvas.

## 3. Design System (Proposed)

### Colors (Light Theme)
*   **Background**: `#f5f5f5` (App bg), `#ffffff` (Panels/Canvas).
*   **Text**: `#333333` (Primary), `#666666` (Secondary/Labels).
*   **Primary Action**: `#007acc` (VS Code-like blue) or `#2c5d87` (Architecture blue).
*   **Borders**: `#e0e0e0` (Subtle dividers).
*   **Canvas Grid**: Light gray faint grid (optional, can be done via CSS background-image).

### Typography
*   **Font**: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.
*   **Size**: 12px-14px for UI controls (compact CAD style).

## 4. Work Items

### 4.1. CSS Architecture (`style.css`)
*   **Variables**: Define `--color-bg`, `--color-primary`, `--spacing-unit` etc.
*   **Reset**: Ensure consistent box-sizing.
*   **Sidebar**:
    *   Style as a "Property Panel".
    *   Group related controls (Draw, Solve, Edit).
    *   Use fieldset/legend or custom headers for grouping.
*   **Canvas Area**:
    *   Add a visual "inset" or shadow to distinguish the drawing area from the chrome.
*   **Controls**:
    *   **Buttons**: Rectangular, slight border radius (2px), flat appearance with hover brightness.
    *   **Inputs**: Standardized height, clear focus ring.

### 4.2. DOM Structure (`index.html`, `main.ts`)
*   May need to wrap control groups in `<div>`s with classes like `.control-group` for easier styling.
*   Add a Title/Header bar above the sidebar or canvas? (Layout decision: user requested side-docked, so a top header might be unnecessary, just a sidebar header).

## 5. Verification
*   **Visual Check**: Does it look like a toy or a tool?
*   **Responsiveness**: Sidebar should remain usable; canvas should resize correctly.
