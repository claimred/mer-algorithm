import './style.css';
import { Renderer } from './Renderer';
import { State } from './State';
import { Point, Segment } from '@src/geometry';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <div class="sidebar">
    <div class="sidebar-header">
      MER Visualizer
    </div>
    
    <div class="control-group">
      <div class="control-group-title">Actions</div>
      <div class="grid-2">
         <button id="undoBtn" class="secondary" disabled title="Undo (Ctrl+Z)">Undo</button>
         <button id="redoBtn" class="secondary" disabled title="Redo (Ctrl+Y)">Redo</button>
      </div>
      <button id="solveBtn" class="primary">Solve MER</button>
      <button id="clearBtn">Clear All</button>
      <button id="randomBtn">Randomize</button>
    </div>

    <div class="control-group">
      <div class="control-group-title">Debug</div>
      <button id="debugBtn">Start Debug Session</button>
      <div id="debugControls" style="display:none; gap: 5px; margin-top: 5px;">
        <button id="nextBtn" style="flex:1;">Next</button>
        <button id="playBtn" style="flex:1;">Play</button>
        <button id="stopBtn" class="secondary" style="flex:1;">Stop</button>
      </div>
    </div>

    <div class="control-group">
      <div class="control-group-title">Presets</div>
      <div class="grid-2">
          <button id="uShapeBtn" title="Load standard U-Shape test case">U-Shape</button>
          <button id="crossBtn" title="Load Cross shape test case">Cross</button>
          <button id="combBtn" title="Load Comb (interleaving bars)">Comb</button>
          <button id="spiralBtn" title="Load Square Spiral">Spiral</button>
          <button id="mazeBtn" title="Load Random Grid Maze">Maze</button>
          <button id="staircaseBtn" title="Load Staircase (monotonic)">Staircase</button>
          <button id="denseBtn" title="Load 50 random segments">Dense</button>
          <button id="starBtn" title="Load Star (radiating lines)">Star</button>
      </div>
    </div>

    <div class="stats" id="stats">
      Ready.<br>
      Obstacles: 0
    </div>

    <div class="sidebar-footer">
      <a href="https://github.com/claimred/mer-algorithm" target="_blank" rel="noopener noreferrer" title="View Source on GitHub">
        <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
        </svg>
        <span>View Source</span>
      </a>
      <span class="version">v1.0.1</span>
    </div>
  </div>
  <div class="main">
    <canvas id="canvas"></canvas>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
const stats = document.querySelector<HTMLDivElement>('#stats')!;
// Buttons
const undoBtn = document.querySelector<HTMLButtonElement>('#undoBtn')!;
const redoBtn = document.querySelector<HTMLButtonElement>('#redoBtn')!;

const renderer = new Renderer(canvas);
const state = new State();

// Interaction State
let isDragging = false;
let dragStart: Point | null = null;
let dragCurrent: Point = { x: 0, y: 0 };


// Resize handling
function resize() {
    const parent = canvas.parentElement;
    if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        renderer.resize(canvas.width, canvas.height);
        state.setBounds(renderer.logicalWidth, renderer.logicalHeight);
        draw();
    }
}

const resizeObserver = new ResizeObserver(() => resize());
resizeObserver.observe(canvas.parentElement!);

// Initial resize
resize();

// Drawing Loop
function draw() {
    renderer.clear();
    renderer.drawGrid();

    // Draw Obstacles
    for (const s of state.obstacles) {
        renderer.drawSegment(s);
    }

    // Draw Result
    if (state.result) {
        renderer.drawRect(state.result);
    }

    // Debug info
    if (state.isDebugging && state.solverStep) {
        if (state.solverStep.window) {
            renderer.drawActiveWindow(state.solverStep.window);
        }
        if (state.solverStep.splitVal !== undefined) {
            const isX = (state.solverStep.type === 'SPLIT_VP');
            renderer.drawSplitLine(state.solverStep.splitVal, isX);
        }
    }

    // Draw current drag line
    if (isDragging && dragStart) {
        renderer.drawSegment(new Segment(dragStart, dragCurrent));
    }
}

function updateStats(msg?: string) {
    stats.innerHTML = `
      Obstacles: ${state.obstacles.length}<br>
      ${msg || ''}
    `;

    // Update button states
    undoBtn.disabled = !state.canUndo();
    redoBtn.disabled = !state.canRedo();
}



canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    const rect = canvas.getBoundingClientRect();
    dragStart = renderer.toLogical(e.clientX - rect.left, e.clientY - rect.top);
    dragCurrent = { ...dragStart };
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const rect = canvas.getBoundingClientRect();
    dragCurrent = renderer.toLogical(e.clientX - rect.left, e.clientY - rect.top);
    draw();
});

canvas.addEventListener('mouseup', () => {
    if (isDragging && dragStart) {
        state.addObstacle(new Segment(dragStart, dragCurrent));
        isDragging = false;
        dragStart = null;
        draw();
        updateStats();
    }
});

// Undo/Redo Logic
function performUndo() {
    if (state.canUndo()) {
        state.undo();
        draw();
        updateStats('Undone.');
    }
}

function performRedo() {
    if (state.canRedo()) {
        state.redo();
        draw();
        updateStats('Redone.');
    }
}

undoBtn.addEventListener('click', performUndo);
redoBtn.addEventListener('click', performRedo);

// Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
            e.preventDefault();
            if (e.shiftKey) {
                performRedo();
            } else {
                performUndo();
            }
        } else if (e.key === 'y') {
            e.preventDefault();
            performRedo();
        }
    }
});


// Buttons
// Debug Controls
const debugControls = document.getElementById('debugControls')!;
let playInterval: number | null = null;

function stopPlayback() {
    if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
    }
}

document.getElementById('debugBtn')!.addEventListener('click', () => {
    stopPlayback();
    state.startDebug();
    debugControls.style.display = 'flex';
    draw();
    updateStats(`Debugging... Step: ${state.solverStep?.type}`);
});

document.getElementById('nextBtn')!.addEventListener('click', () => {
    stopPlayback();
    if (state.isDebugging) {
        state.nextStep();
        draw();

        if (!state.isDebugging) {
            debugControls.style.display = 'none';
            updateStats(`Finished. Area: ${state.result?.width! * state.result?.height!}`);
        } else {
            updateStats(`Step: ${state.solverStep?.type}`);
        }
    }
});

document.getElementById('playBtn')!.addEventListener('click', () => {
    if (playInterval) return;
    playInterval = window.setInterval(() => {
        if (state.isDebugging) {
            state.nextStep();
            draw();
            updateStats(`Step: ${state.solverStep?.type}`);
            if (!state.isDebugging) {
                stopPlayback();
                debugControls.style.display = 'none';
            }
        } else {
            stopPlayback();
        }
    }, 100);
});

document.getElementById('stopBtn')!.addEventListener('click', () => {
    stopPlayback();
    state.isDebugging = false;
    state.iterator = null;
    debugControls.style.display = 'none';
    draw();
    updateStats('Debug stopped.');
});

document.getElementById('solveBtn')!.addEventListener('click', () => {
    stopPlayback();
    const res = state.solve();
    // ... existing solve logic
    draw();
    updateStats(`Area: ${res.area.toFixed(2)}<br>Time: ${res.time.toFixed(2)}ms`);
});

document.getElementById('clearBtn')!.addEventListener('click', () => {
    state.clear();
    draw();
    updateStats();
});

document.getElementById('randomBtn')!.addEventListener('click', () => {
    state.loadRandom();
    draw();
    updateStats();
});

document.getElementById('uShapeBtn')!.addEventListener('click', () => {
    state.loadUShape();
    draw();
    updateStats();
});

document.getElementById('crossBtn')!.addEventListener('click', () => {
    state.loadCross();
    draw();
    updateStats();
});

// New Presets
document.getElementById('combBtn')!.addEventListener('click', () => {
    state.loadComb();
    draw();
    updateStats();
});
document.getElementById('spiralBtn')!.addEventListener('click', () => {
    state.loadSpiral();
    draw();
    updateStats();
});
document.getElementById('mazeBtn')!.addEventListener('click', () => {
    state.loadMaze();
    draw();
    updateStats();
});
document.getElementById('staircaseBtn')!.addEventListener('click', () => {
    state.loadStaircase();
    draw();
    updateStats();
});
document.getElementById('denseBtn')!.addEventListener('click', () => {
    state.loadDense();
    draw();
    updateStats();
});
document.getElementById('starBtn')!.addEventListener('click', () => {
    state.loadStar();
    draw();
    updateStats();
});

// Initial draw
draw();
