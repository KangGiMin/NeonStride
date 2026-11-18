import { routeToView, worldToView } from "./route-view.js";

export class CanvasSurface {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.w = 0;
    this.h = 0;
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.w = rect.width;
    this.h = rect.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  project(x, y, z) {
    if (this.characterSpace) x += this.playerX ?? 0;
    else if (this.view) ({ x, z } = routeToView(this.view, x, z));
    return this.projectView(x, y, z);
  }

  projectWorld(x, y, z) {
    if (this.view) ({ x, z } = worldToView(this.view, x, z));
    return this.projectView(x, y, z);
  }

  projectView(x, y, z) {
    const f = this.h * 0.94,
      k = f / Math.max(0.3, z + 7);
    return { x: this.w / 2 + x * k, y: this.h * 0.36 + (3.6 - y) * k, k };
  }

  poly(points, fill, stroke, glow = 0) {
    const c = this.ctx;
    c.beginPath();
    points.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    c.closePath();
    c.fillStyle = fill;
    if (fill) c.fill();
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = 1;
      c.shadowBlur = glow;
      c.shadowColor = stroke;
      c.stroke();
      c.shadowBlur = 0;
    }
  }

  line(points, color, width = 1, glow = 0) {
    const c = this.ctx;
    c.beginPath();
    points.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineJoin = "round";
    c.lineCap = "round";
    c.shadowColor = color;
    c.shadowBlur = glow;
    c.stroke();
    c.shadowBlur = 0;
  }

  quad(x1, x2, z1, z2, y, color, stroke) {
    this.poly(
      [
        this.project(x1, y, z1),
        this.project(x2, y, z1),
        this.project(x2, y, z2),
        this.project(x1, y, z2),
      ],
      color,
      stroke,
    );
  }

  box(x, y, z, width, height, depth, colors, edge, projectPoint) {
    const p = projectPoint || ((a, b, d) => this.project(a, b, d));
    const l = x - width / 2,
      r = x + width / 2,
      t = y + height,
      back = z + depth;
    this.poly(
      [p(l, y, z), p(l, y, back), p(l, t, back), p(l, t, z)],
      colors[1],
      edge,
    );
    this.poly(
      [p(r, y, z), p(r, y, back), p(r, t, back), p(r, t, z)],
      colors[1],
      edge,
    );
    this.poly(
      [p(l, t, z), p(r, t, z), p(r, t, back), p(l, t, back)],
      colors[2],
      edge,
    );
    this.poly(
      [p(l, y, z), p(r, y, z), p(r, t, z), p(l, t, z)],
      colors[0],
      edge,
    );
  }

  worldLine(points, color, radius, glow = 0) {
    const projected = points.map((p) => this.project(p.x, p.y, p.z));
    this.line(
      projected,
      color,
      Math.max(
        1,
        (projected.reduce((sum, p) => sum + p.k, 0) / projected.length) *
          radius,
      ),
      glow,
    );
  }
}
