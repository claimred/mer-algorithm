# Feature Spec: Info & Links

## 1. Goal
Add context and helpful information to the MER Visualization UI.

## 2. Requirements
*   **Source Code Link**: A visible link to the GitHub repository.
*   **Version Info**: Display "v1.0.1" (or similar).
*   **Tooltips**: Enhance button `title` attributes with more descriptive text.
*   **Location**: Sidebar Footer seems most appropriate for distinct "meta" info.

## 3. Design
### Sidebar Footer
*   Bottom of the sidebar (`margin-top: auto` is already used for `.stats`, maybe put it below stats or integrate).
*   **Layout**:
    *   Separator line.
    *   GitHub Icon + "View Source".
    *   Version text (small, distinct color).

### Tooltips
*   **Undo**: "Undo last segment addition (Ctrl+Z)"
*   **Redo**: "Redo last undone action (Ctrl+Y)"
*   **Solve**: "Run MER Algorithm (O(n log^2 n))"
*   **Benchmarks/Debug**: "Step-by-step visualization"

## 4. Implementation Steps
1.  **HTML**: Update `main.ts` to include a `.sidebar-footer` section.
2.  **CSS**: Style the footer (padding, border-top, flex layout).
3.  **Icons**: Use a simple SVG for GitHub (inline) to avoid dependency issues.

## 5. Verification
*   **Visual**: Check footer appearance in Hybrid theme.
*   **Functional**: Click link -> Opens GitHub. Hover buttons -> Shows tooltips.
