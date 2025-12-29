import { Rectangle, Segment, Point } from '@src/geometry';

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private width: number = 0;
    private height: number = 0;
    private scaleX: number = 1;
    private scaleY: number = 1;

    // Logic bounds (0..100)
    private readonly logicalSize = 100;
    private readonly margin = 10;

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d')!;
        this.resize(canvas.width, canvas.height);
    }

    resize(w: number, h: number) {
        this.width = w;
        this.height = h;

        // Fit height to 100 logical units, width adapts
        const availableH = h - 2 * this.margin;
        this.scaleY = availableH / this.logicalSize;
        this.scaleX = this.scaleY; // Keep square tokens (1:1 aspect ratio for shapes)
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    toScreen(x: number, y: number): Point {
        // Center the content
        // Width of logical area is determined by container width? 
        // No, we want to expand the logical area horizontally if screen is wide?
        // OR do we just want to zoom in?
        // User said "Make visualization bigger".
        // If we fix ScaleY based on Height, ScaleX = ScaleY.
        // Then visible logical width = (Width - 2*Margin) / ScaleX.

        // Let's implement full flexible centering
        // Logical origin (0,0) is bottom-left of the visible area?
        // Or do we keep (0,0) at bottom-left of the 100x100 box, but allow drawing outside?
        // Current code assumes 0..100 logic.
        // If we want "bigger", maybe we just want to FILL the screen.

        // Let's shift so (0,0) is bottom-left + margin.
        // const originX = this.width / 2 - (50 * this.scaleX); // Keep 0..100 centered?
        // Actually, let's keep the standard 0..100 centered to avoid breaking everything.
        // But scaling is now based on Height only (so it fills height).


        const contentW = this.logicalSize * this.scaleX;
        const contentH = this.logicalSize * this.scaleY;

        const offsetX = (this.width - contentW) / 2;
        const offsetY = (this.height - contentH) / 2;

        return {
            x: offsetX + x * this.scaleX,
            y: offsetY + (this.logicalSize - y) * this.scaleY
        };
    }

    toLogical(sx: number, sy: number): Point {
        const contentW = this.logicalSize * this.scaleX;
        const contentH = this.logicalSize * this.scaleY;
        const offsetX = (this.width - contentW) / 2;
        const offsetY = (this.height - contentH) / 2;

        const x = (sx - offsetX) / this.scaleX;
        const y = this.logicalSize - ((sy - offsetY) / this.scaleY);
        return { x, y };
    }

    drawGrid() {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();

        // 10x10 grid
        for (let i = 0; i <= 100; i += 10) {
            const p1 = this.toScreen(i, 0);
            const p2 = this.toScreen(i, 100);
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);

            const p3 = this.toScreen(0, i);
            const p4 = this.toScreen(100, i);
            this.ctx.moveTo(p3.x, p3.y);
            this.ctx.lineTo(p4.x, p4.y);
        }
        this.ctx.stroke();

        // Border
        this.ctx.strokeStyle = '#000';
        this.ctx.strokeRect(
            this.toScreen(0, 100).x,
            this.toScreen(0, 100).y, // Top-Left in screen
            this.logicalSize * this.scaleX,
            this.logicalSize * this.scaleY
        );
    }

    drawSegment(s: Segment) {
        const p1 = this.toScreen(s.p1.x, s.p1.y);
        const p2 = this.toScreen(s.p2.x, s.p2.y);

        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();

        // Endpoint dots
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(p1.x, p1.y, 3, 0, Math.PI * 2);
        this.ctx.arc(p2.x, p2.y, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawRect(r: Rectangle, color: string = 'rgba(0, 255, 0, 0.3)') {
        // Rectangle from core is { x, y, width, height } where (x,y) is bottom-left (Cartesian)
        // Renderer toScreen expects (x, y) as Cartesian coordinates.
        // Screen Y is flipped.

        // Logical Bottom-Left
        const pMin = this.toScreen(r.x, r.y + r.height); // Top-Left of screen (Logical Y max)
        const pMax = this.toScreen(r.x + r.width, r.y); // Bottom-Right of screen (Logical Y min)

        this.ctx.fillStyle = color;
        this.ctx.fillRect(pMin.x, pMin.y, pMax.x - pMin.x, pMax.y - pMin.y);

        this.ctx.strokeStyle = 'green';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(pMin.x, pMin.y, pMax.x - pMin.x, pMax.y - pMin.y);
    }
    drawSplitLine(val: number, isX: boolean) {
        this.ctx.strokeStyle = 'red';
        this.ctx.setLineDash([5, 5]);
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        if (isX) {
            const p1 = this.toScreen(val, 0); // Bottom
            const p2 = this.toScreen(val, 100); // Top
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
        } else {
            const p1 = this.toScreen(0, val);
            const p2 = this.toScreen(100, val);
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
        }
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawActiveWindow(r: Rectangle) {
        const pMin = this.toScreen(r.x, r.y + r.height);
        const pMax = this.toScreen(r.x + r.width, r.y);
        this.ctx.strokeStyle = 'blue';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(pMin.x, pMin.y, pMax.x - pMin.x, pMax.y - pMin.y);
        this.ctx.setLineDash([]);
    }
}
