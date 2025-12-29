import { Rectangle, Segment, Point } from '@src/geometry';

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private width: number = 0;
    private height: number = 0;
    private scaleX: number = 1;
    private scaleY: number = 1;

    // Logic bounds
    public logicalWidth = 100;
    public readonly logicalHeight = 100; // Height is fixed reference
    private readonly margin = 10;


    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d')!;
        this.resize(canvas.width, canvas.height);
    }

    resize(w: number, h: number) {
        this.width = w;
        this.height = h;

        // Fit height to 100 logical units
        const availableH = h - 2 * this.margin;
        this.scaleY = availableH / this.logicalHeight;
        this.scaleX = this.scaleY; // Keep square tokens

        // Calculate reachable logical width
        const availableW = w - 2 * this.margin;
        this.logicalWidth = availableW / this.scaleX;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    toScreen(x: number, y: number): Point {
        // Standard Cartesian with margin offset
        // (0,0) is at bottom-left of the valid area
        return {
            x: this.margin + x * this.scaleX,
            y: this.margin + (this.logicalHeight - y) * this.scaleY
        };
    }

    toLogical(sx: number, sy: number): Point {
        const x = (sx - this.margin) / this.scaleX;
        const y = this.logicalHeight - ((sy - this.margin) / this.scaleY);
        return { x, y };
    }

    drawGrid() {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();

        // Grid lines every 10 units
        // Vertical lines
        for (let i = 0; i <= this.logicalWidth; i += 10) {
            const p1 = this.toScreen(i, 0);
            const p2 = this.toScreen(i, this.logicalHeight);
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
        }

        // Horizontal lines
        for (let i = 0; i <= this.logicalHeight; i += 10) {
            const p1 = this.toScreen(0, i);
            const p2 = this.toScreen(this.logicalWidth, i);
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
        }
        this.ctx.stroke();

        // Border
        this.ctx.strokeStyle = '#000';

        // Let's use strokeRect on screen coords
        const tl = this.toScreen(0, this.logicalHeight); // Top-Left
        const br = this.toScreen(this.logicalWidth, 0);  // Bottom-Right

        this.ctx.strokeRect(
            tl.x,
            tl.y,
            br.x - tl.x,
            br.y - tl.y
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
            const p2 = this.toScreen(val, this.logicalHeight); // Top
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
        } else {
            const p1 = this.toScreen(0, val);
            const p2 = this.toScreen(this.logicalWidth, val);
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
