import test from "node:test";
import assert from "node:assert/strict";
import {} from "../../src/engine.js";
import { advance, empty, obstacle } from "../fixtures/engine.js";

test("new monster and horizontal fire require ducking at face height", () => {
  for (const type of ["monster", "fire"]) {
    const hit = empty();
    obstacle(hit, type);
    advance(hit, 0.4);
    assert.equal(hit.reason, type);
    const safe = empty();
    obstacle(safe, type);
    safe.slide();
    advance(safe, 0.5);
    assert.equal(safe.status, "running");
    assert.equal(safe.cleared, 1);
  }
});

test("one fallen tree can be jumped; two piled trees require double jump", () => {
  for (const variant of [1, 2]) {
    const g = empty();
    obstacle(g, "trees", 6);
    g.obstacles[0].variant = variant;
    g.jump();
    advance(g, 0.19);
    if (variant === 2) g.jump();
    advance(g, 0.45);
    assert.equal(g.status, "running");
    assert.equal(g.cleared, 1);
  }
  const failed = empty();
  obstacle(failed, "trees", 6);
  failed.obstacles[0].variant = 2;
  failed.jump();
  advance(failed, 0.5);
  assert.equal(failed.reason, "trees");
});
