# Project Tasks & Roadmap

## Urgent Fixes
- [ ] **Cross Shape Bug**: Investigate and fix reported bug with Cross shape in the center.
- [ ] **U-Shape Test Coverage**: Expand test suite for U-shape scenarios to prevent regressions.

## DevOps & Infrastructure
- [ ] **Add CI Pipeline**: Configure GitHub Actions to run `npm test` and `npm run build` on every push and pull request.
- [ ] **Add CD Pipeline**: Configure GitHub Actions to automatically deploy the `visualization` project to GitHub Pages upon merging to `main`.

## Core Algorithm (pmer-ts)
- [ ] **Performance Benchmarking**: Create a benchmark suite to measure `solve` performance against large random datasets (N=1k, 10k, 100k) and compare with naive baseline.
- [ ] **Fuzz Testing**: Implement property-based testing (e.g., using fast-check) to catch edge cases like collinear points, zero-length segments, or overlapping obstacles.
- [ ] **Polygon Support**: Add a helper to decompose polygons into standard line segments for the solver.

## Visualization
- [ ] **Touch Support**: Enable touch events for drawing/dragging on mobile devices.
- [ ] **Export Options**: Add buttons to export the solution state as JSON or download the canvas as an image.
- [ ] **Advanced Presets**: Add more complex debug scenarios (e.g., "Comb", "Spiral", "Maze").
- [ ] **UI Polish**: Improve styling (currently vanilla CSS) for a more modern look.

## Documentation
- [ ] **API Documentation**: Add TSDoc comments to `MerSolver`, `Stair`, and `StairBuilder` for better IDE support.
