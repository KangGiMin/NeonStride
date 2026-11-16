import test from "node:test";
import assert from "node:assert/strict";
import { RULES } from "../../src/engine.js";
import { advance, empty, obstacle } from "../fixtures/engine.js";

test("second air jump works; third is blocked; landing resets jumps", () => {
  const g = empty();
  assert.ok(g.jump());
  advance(g, 0.2);
  const height = g.y;
  assert.ok(g.jump());
  assert.equal(g.jumps, 2);
  assert.equal(g.jump(), false);
  advance(g, 0.2);
  assert.ok(g.y > height);
  advance(g, 2);
  assert.equal(g.y, 0);
  assert.equal(g.jumps, 0);
  assert.ok(g.jump());
});

test("jump exits sliding and permits another immediate air-to-slide correction", () => {
  const g = empty();
  g.slide(true);
  g.jump();
  assert.equal(g.sliding, false);
  advance(g, 0.1);
  assert.equal(g.slide(), true);
  assert.ok(g.sliding);
});

test("slide instantly cancels rising and falling single or double jumps", () => {
  for (const doubled of [false, true])
    for (const airborneTime of [0.12, 0.55]) {
      const g = empty();
      g.jump();
      if (doubled) {
        advance(g, 0.19);
        g.jump();
      }
      advance(g, airborneTime);
      assert.ok(g.y > 0);
      assert.equal(g.slide(true), true);
      assert.equal(g.y, 0);
      assert.equal(g.vy, 0);
      assert.equal(g.jumps, 0);
      assert.ok(g.sliding);
      assert.equal(g.height, RULES.slideHeight);
      advance(g, 0.05);
      assert.equal(g.y, 0);
      assert.ok(g.sliding);
      assert.ok(g.jump());
      assert.equal(g.jumps, 1, "next jump starts from the ground");
    }
});
