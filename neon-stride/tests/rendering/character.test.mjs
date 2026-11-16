import test from "node:test";
import assert from "node:assert/strict";
import { Runner } from "../../src/engine.js";
import { createCanvasHost } from "../fixtures/canvas.js";

test("run-to-jump poses blend smoothly, freeze when paused, and reset for sliding or a new run", async () => {
  const canvasHost = createCanvasHost(),
    { Element } = canvasHost;
  const { Scene } = await import("../../src/renderer.js"),
    scene = new Scene(new Element()),
    g = new Runner(() => 0);
  g.start();
  scene.character(g, 1, false);
  assert.equal(scene.airBlend, 0);
  g.jump();
  g.update(0.1);
  scene.character(g, 1 + 1 / 60, false);
  assert.ok(scene.airBlend > 0 && scene.airBlend < 1);
  scene.character(g, 1.1, false);
  const inAir = scene.airBlend;
  g.pause();
  scene.character(g, 1.1, false);
  assert.equal(scene.airBlend, inAir);
  g.resume();
  g.y = 0;
  g.vy = 0;
  g.jumps = 0;
  scene.character(g, 1.1 + 1 / 60, false);
  assert.ok(
    scene.airBlend > 0 && scene.airBlend < inAir,
    "landing eases back into the stride",
  );
  g.slide();
  scene.character(g, 1.2, false);
  assert.equal(scene.airBlend, 0);
  g.start();
  scene.character(g, 0, false);
  assert.equal(scene.airBlend, 0);
});

test("falling runner is clipped by the near ledge and disappears at the end of the descent", async () => {
  const canvasHost = createCanvasHost(),
    { Element } = canvasHost;
  const { Scene } = await import("../../src/renderer.js");
  const scene = new Scene(new Element()),
    g = new Runner(() => 0);
  g.start();
  g.obstacles = [{ type: "gap", position: -0.1, length: 12, id: 0 }];
  g.end("gap");
  const oldClips = canvasHost.clipCount;
  scene.render(g, 0);
  assert.ok(canvasHost.clipCount > oldClips);
  const edge = scene.project(0, 0, -0.1).y;
  assert.ok(Math.abs(canvasHost.lastClipRect[3] - edge) < 1e-8);
  for (const step of [0.15, 0.2, 0.25]) {
    g.update(step);
    scene.render(g, g.fallTime);
  }
  g.update(1);
  assert.equal(g.status, "over");
  const count = canvasHost.drawCount;
  scene.character(g, 2, false);
  assert.equal(
    canvasHost.drawCount,
    count,
    "completed fall leaves no runner above the road",
  );
});
