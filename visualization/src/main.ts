import './style.css';
import { Renderer } from './Renderer';
import { State } from './State';
import { Point } from '@src/geometry';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <div class="sidebar">
    <h2>MER Visualizer</h2>
    
    <div class="controls">
      <h3>Actions</h3>
      <button id="solveBtn">Solve</button>
      <button id="clearBtn" class="secondary">Clear</button>
      <button id="randomBtn" class="secondary">Randomize</button>
    </div>

    <div class="controls">
      <h3>Presets</h3>
      <button id="uShapeBtn" class="secondary">U-Shape</button>
      <button id="crossBtn" class="secondary">Cross</button>
    </div>

    <div class="stats" id="stats">
      Ready.<br>
      Obstacles: 0
    </div>
    
    <h3>Instructions</h3>
    <small>Drag on canvas to draw lines.</small>
  </div>
  <div class="main">
    <canvas id="canvas"></canvas>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
const stats = document.querySelector<HTMLDivElement>('#stats')!;
const renderer = new Renderer(canvas);
const state = new State();

// Resize handling
function resize() {
    canvas.width = canvas.parentElement!.clientWidth;
    canvas.height = canvas.parentElement!.clientHeight;
    renderer.resize(canvas.width, canvas.height);
    draw();
}
window.addEventListener('resize', resize);
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

    // Draw current drag line
    if (isDragging && dragStart) {
        renderer.drawSegment({ p1: dragStart, p2: dragCurrent });
    }
}

function updateStats(msg?: string) {
    stats.innerHTML = `
      Obstacles: ${state.obstacles.length}<br>
      ${msg || ''}
    `;
}

// Interaction
let isDragging = false;
let dragStart: Point | null = null;
let dragCurrent: Point = { x: 0, y: 0 };

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
        state.addObstacle({ p1: dragStart, p2: dragCurrent });
        isDragging = false;
        dragStart = null;
        draw();
        updateStats();
    }
});

// Buttons
document.getElementById('solveBtn')!.addEventListener('click', () => {
    const res = state.solve();
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

// Initial draw
draw();
