# Pull Request: Info & Links

**PR Type**: Feature
**Related Issue**: `issues/3-info-links.md`

## Summary
Adds a footer to the sidebar with a prominent "View Source" link pointing to the GitHub repository, along with a version indicator. Also enhances button tooltips for better usability.

## Implementation Details
1.  **Sidebar Footer**: Added `.sidebar-footer` to `main.ts` with SVG icon for GitHub.
2.  **Styles**: Styled the footer to sit at the bottom of the sidebar (`margin-top: auto`) with a clean look matching the Hybrid theme.
3.  **Tooltips**: Updated `title` attributes for Presets to be more descriptive.

## Test Plan
1.  **Automated**: `npm run build` passed.
2.  **Manual**:
    *   Verify "View Source" link opens GitHub in a new tab.
    *   Verify footer layout is correct (bottom of sidebar).
    *   Verify tooltips appear on hover.

## Verification Results
*   Build successful.
*   Footer integrates well with the new UI.
