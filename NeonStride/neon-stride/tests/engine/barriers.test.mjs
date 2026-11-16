import test from "node:test";
import assert from "node:assert/strict";
import {} from "../../src/engine.js";
import { advance, empty, obstacle } from "../fixtures/engine.js";

test("low obstacles collide on ground and can be jumped over", () => {
  const g = empty();
  obstacle(g, "low");
  advance(g, 0.5);
  assert.equal(g.reason, "low");
  const score = g.score;
  advance(g, 5);
  assert.equal(g.score, score);
  const pass = empty();
  obstacle(pass, "low", 4);
  pass.jump();
  advance(pass, 0.6);
  assert.equal(pass.status, "running");
  assert.equal(pass.cleared, 1);
});

test("high barrier requires double jump", () => {
  const single = empty();
  obstacle(single, "high", 7);
  single.jump();
  advance(single, 0.8);
  assert.equal(single.status, "over");
  const double = empty();
  obstacle(double, "high", 7);
  double.jump();
  advance(double, 0.2);
  double.jump();
  advance(double, 0.7);
  assert.equal(double.status, "running");
  assert.equal(double.cleared, 1);
});

test("overhead gate requires slide; tapping expires; holding remains active", () => {
  const standing = empty();
  obstacle(standing, "bar");
  advance(standing, 0.5);
  assert.equal(standing.reason, "bar");
  const g = empty();
  obstacle(g, "bar");
  g.slide();
  assert.ok(g.sliding);
  advance(g, 0.5);
  assert.equal(g.status, "running");
  advance(g, 0.5);
  assert.equal(g.sliding, false);
  g.slide(true);
  advance(g, 2);
  assert.ok(g.sliding);
  g.slideHeld = false;
  assert.equal(g.sliding, false);
});

test("correcting a mistaken jump into a slide avoids overhead obstacles", () => {
  for (const type of ["bar", "monster", "fire"]) {
    const g = empty();
    obstacle(g, type, 6);
    g.jump();
    advance(g, 0.2);
    assert.ok(g.y > 0);
    g.slide();
    advance(g, 0.4);
    assert.equal(g.status, "running");
    assert.equal(g.cleared, 1);
  }
});
