# Feature: Undo/Redo

## Goal
Allow users to revert and re-apply changes to the application state (obstacles and results) to facilitate experimentation and recover from mistakes.

## Scope
The following actions must be recordable in the history stack:
1.  **Adding Obstacles**: Drawing a new segment.
2.  **Loading Presets**: Replaces all obstacles (Atomic operation).
3.  **Clearing Board**: Removes all obstacles.
4.  **Randomizing**: Generates new random obstacles.
5.  **Solving**: The calculation of the `result` (Best Rectangle) is part of the state. Undo should revert to the pre-solved state (result = null) or the previous result.

## Technical Requirements
- **State Snapshot**:
  - `obstacles`: `Segment[]`
  - `result`: `Rectangle | null`
- **History Stack**:
  - `undoStack`: Array of snapshots.
  - `redoStack`: Array of snapshots.
  - **Limit**: MAX_HISTORY = 50. Oldest entries are dropped when limit is reached.
- **Deep Copy**: Ensure state objects are deep-copied to prevent reference mutation issues.

## UI Specification
- **Buttons**:
  - Add "Undo" and "Redo" buttons to the `Actions` section of the Sidebar.
  - Icons: ↩️ (Undo), ↪️ (Redo) or text.
- **Hotkeys**:
  - `Ctrl+Z` (or `Cmd+Z` on Mac): Undo.
  - `Ctrl+Y` (or `Cmd+Shift+Z` / `Ctrl+Shift+Z`): Redo.
- **State Feedback**:
  - Buttons should be disabled if the respective stack is empty.

## Interaction Flow
1.  **Action**: User performs an action (e.g., Draw).
2.  **Record**: Push *current* state to `undoStack`. Clear `redoStack`. Update *current* state.
3.  **Undo**:
    - Pop from `undoStack`.
    - Push *current* state to `redoStack`.
    - Set *current* state to popped value.
4.  **Redo**:
    - Pop from `redoStack`.
    - Push *current* state to `undoStack`.
    - Set *current* state to popped value.
