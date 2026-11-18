import test from "node:test";
import assert from "node:assert/strict";
import { Runner } from "../../src/engine.js";
import { Scene } from "../../src/renderer.js";
import { makeCorner } from "../../src/game/navigation/route.js";
import {
  createStrikes,
  updateHazards,
} from "../../src/game/obstacles/dynamic.js";
import { createCanvasHost } from "../fixtures/canvas.js";

test("both road corners render finite coordinates before, during and after camera rotation", () => {
  const host = createCanvasHost(),
    scene = new Scene(new host.Element()),
    g = new Runner(() => 0);
  for (const direction of [-1, 1])
    for (const offset of [-20, -2, 0.05, 2, 8]) {
      g.start();
      g.obstacles = [];
      g.corners = [makeCorner(null, 30, direction)];
      g.distance = 30 + offset;
      if (offset > 0) {
        g.heading = (direction * Math.PI) / 2;
        g.turnAnimation = { direction, elapsed: offset / 14 };
      }
      scene.render(g, 2);
    }
  assert.ok(host.drawCount > 1000);
});

test("new hazards render approach, lock, firing and clearance including reduced EMP", () => {
  const host = createCanvasHost(),
    scene = new Scene(new host.Element()),
    g = new Runner(() => 0);
  for (const type of ["energy", "emp", "patrol", "shutter", "airstrike"])
    for (const variant of [1, 2])
      for (const seconds of [2, 0.6, 0.03, -0.05, -0.5, -1.5]) {
        g.start();
        g.corners = [];
        g.distance = 100;
        const o = {
          type,
          variant,
          position: 100 + g.speed * seconds,
          length: g.speed * 3,
          id: 1,
          phase: 0,
        };
        if (type === "airstrike") {
          o.strikes = createStrikes(o.position, g.speed);
          o.strikes.forEach((s) => (s.x = 1));
        }
        g.obstacles = [o];
        updateHazards(g);
        scene.render(g, 2);
        scene.reduced = true;
        scene.render(g, 2);
        scene.reduced = false;
      }
  assert.ok(host.drawCount > 1000);
});
