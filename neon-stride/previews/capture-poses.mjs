// Capture the actual Canvas character drawing for offline silhouette review.
import { writeFile } from "node:fs/promises";
import { Scene } from "../src/renderer.js";
import { Runner } from "../src/engine.js";
globalThis.devicePixelRatio = 1;
globalThis.matchMedia = () => ({ matches: false });
globalThis.ResizeObserver = class {
  observe() {}
};
let operations = [],
  path = [],
  closed = false,
  ellipse,
  stack = [];
const ctx = {
  fillStyle: "#fff",
  strokeStyle: "#fff",
  lineWidth: 1,
  globalAlpha: 1,
  setTransform() {},
  beginPath() {
    path = [];
    closed = false;
    ellipse = null;
  },
  moveTo(x, y) {
    path.push([x, y]);
  },
  lineTo(x, y) {
    path.push([x, y]);
  },
  closePath() {
    closed = true;
  },
  arc(x, y, rx) {
    ellipse = { x, y, rx, ry: rx };
  },
  ellipse(x, y, rx, ry) {
    ellipse = { x, y, rx, ry };
  },
  rect(x, y, width, height) {
    path = [
      [x, y],
      [x + width, y],
      [x + width, y + height],
      [x, y + height],
    ];
    this.pendingClip = { x, y, width, height };
  },
  clip() {
    this.clipRegion = this.pendingClip;
  },
  createLinearGradient() {
    return {
      color: "#00000000",
      addColorStop(at, color) {
        this.color = color;
      },
    };
  },
  fill() {
    operations.push({
      kind: ellipse ? "ellipse" : "fill",
      ...ellipse,
      path: path.slice(),
      color:
        typeof this.fillStyle === "string"
          ? this.fillStyle
          : this.fillStyle.color,
      alpha: this.globalAlpha,
      clip: this.clipRegion,
    });
  },
  stroke() {
    operations.push({
      kind: ellipse ? "ellipseStroke" : "stroke",
      ...ellipse,
      path: path.slice(),
      closed,
      color: this.strokeStyle,
      width: this.lineWidth,
      alpha: this.globalAlpha,
      clip: this.clipRegion,
    });
  },
  fillRect(x, y, w, h) {
    operations.push({
      kind: "fill",
      path: [
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h],
      ],
      color:
        typeof this.fillStyle === "string"
          ? this.fillStyle
          : this.fillStyle.color,
      alpha: this.globalAlpha,
      clip: this.clipRegion,
    });
  },
  save() {
    stack.push({
      fillStyle: this.fillStyle,
      strokeStyle: this.strokeStyle,
      lineWidth: this.lineWidth,
      globalAlpha: this.globalAlpha,
      clipRegion: this.clipRegion,
    });
  },
  restore() {
    Object.assign(this, stack.pop());
  },
};
const scene = new Scene({
  getContext: () => ctx,
  getBoundingClientRect: () => ({ width: 700, height: 1200 }),
});
const frames = [];
const falling = process.argv.includes("--fall");
if (falling) {
  for (const time of [0, 0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.85]) {
    const game = new Runner(() => 0);
    game.start();
    game.obstacles = [{ type: "gap", position: -0.1, length: 12, id: 0 }];
    game.end("gap");
    game.update(time);
    operations = [];
    scene.road(game.distance, game.obstacles, game.speed, game.difficulty);
    scene.character(game, time, false);
    frames.push(operations);
  }
} else {
  for (const phase of Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4)) {
    operations = [];
    scene.character(
      {
        status: "running",
        reason: "",
        y: 0,
        sliding: false,
        distance: phase / 0.045,
      },
      0,
      false,
    );
    frames.push(operations);
  }
}
await writeFile(
  new URL(falling ? "fall-poses.json" : "poses.json", import.meta.url),
  JSON.stringify(frames),
);
console.log(
  falling
    ? "Captured eight falling frames."
    : "Captured eight natural running frames.",
);
