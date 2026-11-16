import test from "node:test";
import assert from "node:assert/strict";
import {} from "../../src/engine.js";
import { advance, empty, obstacle } from "../fixtures/engine.js";

test("score accumulates 10 points per active second; speed increases", () => {
  const g = empty();
  advance(g, 10);
  assert.equal(g.score, 100);
  assert.ok(g.speed > 14);
  g.pause();
  const distance = g.distance;
  advance(g, 5);
  assert.equal(g.score, 100);
  assert.equal(g.distance, distance);
  g.resume();
  advance(g, 1);
  assert.equal(g.score, 110);
});

test("air-to-slide is ignored while paused or after game over", () => {
  const g = empty();
  g.jump();
  advance(g, 0.15);
  const height = g.y;
  g.pause();
  assert.equal(g.slide(), false);
  assert.equal(g.y, height);
  g.end("bar");
  assert.equal(g.slide(), false);
  assert.equal(g.y, height);
});

test("restart resets score, speed, player and obstacle sequence", () => {
  const g = empty();
  advance(g, 30);
  g.jump();
  g.end("low");
  g.start();
  assert.equal(g.score, 0);
  assert.equal(g.speed, 14);
  assert.equal(g.y, 0);
  assert.equal(g.jumps, 0);
  assert.equal(g.status, "running");
  assert.equal(g.cleared, 0);
  assert.equal(g.obstacles[0].position, 48);
});

test("large time steps still detect collisions", () => {
  const g = empty();
  obstacle(g, "low", 3);
  g.update(2);
  assert.equal(g.status, "over");
  assert.ok(g.distance < 4);
});
