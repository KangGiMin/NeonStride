import test from "node:test";
import assert from "node:assert/strict";
import {} from "../../src/engine.js";
import { advance, empty, obstacle } from "../fixtures/engine.js";

test("air-to-slide cannot stand on a missing road section", () => {
  for (const type of ["gap", "collapse"]) {
    const g = empty();
    obstacle(g, type, 0, 12);
    g.jump();
    advance(g, 0.1);
    assert.equal(g.status, "running");
    g.slide();
    g.update(1 / 120);
    assert.equal(g.reason, type);
    assert.equal(g.status, "falling");
  }
});

test("grounded runner falls into gap; timed double jump crosses full gap", () => {
  const fall = empty();
  obstacle(fall, "gap", 4, 9);
  advance(fall, 0.7);
  assert.equal(fall.reason, "gap");
  const pass = empty();
  obstacle(pass, "gap", 4, 9);
  pass.jump();
  advance(pass, 0.23);
  pass.jump();
  advance(pass, 0.8);
  assert.equal(pass.status, "running");
  assert.equal(pass.cleared, 1);
});

test("landing before far side of gap ends run", () => {
  const g = empty();
  obstacle(g, "gap", 3, 35);
  g.jump();
  advance(g, 1);
  assert.equal(g.reason, "gap");
});

test("steel-collapse road section demands a double jump over its full span", () => {
  for (const doubled of [false, true]) {
    const g = empty();
    obstacle(g, "collapse", 3.2, g.speed * 0.8);
    g.jump();
    advance(g, 0.19);
    if (doubled) g.jump();
    advance(g, 1);
    assert.equal(g.status, doubled ? "running" : "falling");
    if (!doubled) assert.equal(g.reason, "collapse");
  }
});
