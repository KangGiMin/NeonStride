import test from "node:test";
import assert from "node:assert/strict";
import { Runner } from "../../src/engine.js";
import { NAVIGATION } from "../../src/config/navigation.js";
import { makeCorner, routeFrame } from "../../src/game/navigation/route.js";
import { empty, advance } from "../fixtures/engine.js";

test("holding left and right moves continuously within the road and release stops movement", () => {
  const g = empty();
  g.move(1);
  advance(g, 0.2);
  assert.ok(g.x > 1 && g.x < 2);
  g.move(0);
  const x = g.x;
  advance(g, 0.4);
  assert.equal(g.x, x);
  g.move(1);
  advance(g, 1);
  assert.equal(g.x, NAVIGATION.lateralLimit);
  g.move(-1);
  advance(g, 2);
  assert.equal(g.x, -NAVIGATION.lateralLimit);
  g.pause();
  assert.equal(g.steer, 0);
  assert.equal(g.move(1), false);
  advance(g, 2);
  assert.equal(g.x, -NAVIGATION.lateralLimit);
});

for (const direction of [-1, 1])
  test(`a queued ${direction === 1 ? "right" : "left"} corner rotates exactly 90 degrees and preserves lateral position`, () => {
    const g = empty();
    g.x = 1.2;
    const corner = makeCorner(null, g.speed * 0.9, direction);
    g.corners = [corner];
    assert.equal(g.turn(direction), false, "too early");
    advance(g, 0.4);
    assert.equal(g.turn(direction), true);
    assert.equal(g.turn(direction), false, "single input per corner");
    advance(g, 0.6);
    assert.equal(g.status, "running");
    assert.equal(g.turnsCompleted, 1);
    assert.equal(g.heading, (direction * Math.PI) / 2);
    assert.equal(g.x, 1.2);
    assert.equal(corner.turned, true);
  });

test("missing a corner or choosing the wrong direction ends the run", () => {
  for (const wrong of [false, true]) {
    const g = empty();
    g.corners = [makeCorner(null, g.speed * 0.4, 1)];
    if (wrong) g.turn(-1);
    else advance(g, 0.7);
    assert.equal(g.status, "over");
    assert.equal(g.reason, "corner");
  }
});

test("route geometry contains perpendicular segments after right and left turns", () => {
  const first = makeCorner(null, 10, 1),
    second = makeCorner(first, 20, -1);
  const a = routeFrame([first, second], 15),
    b = routeFrame([first, second], 25);
  assert.ok(Math.abs(a.x - 5) < 1e-8 && Math.abs(a.z - 10) < 1e-8);
  assert.ok(Math.abs(b.x - 10) < 1e-8 && Math.abs(b.z - 15) < 1e-8);
  assert.equal(a.heading, Math.PI / 2);
  assert.equal(b.heading, 0);
});

test("random corners change on restart and generated hazards leave clear turning space", () => {
  let seed = 17;
  const random = () =>
    (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const g = new Runner(random);
  g.start();
  const before = g.corners.map((c) => [c.position, c.direction]);
  g.start();
  assert.notDeepEqual(
    g.corners.map((c) => [c.position, c.direction]),
    before,
  );
  for (const c of g.corners)
    for (const o of g.obstacles) {
      assert.ok(
        o.position + o.length <=
          c.position - g.speed * NAVIGATION.clearBeforeSeconds ||
          o.position >= c.position + g.speed * NAVIGATION.clearAfterSeconds,
      );
    }
  g.move(1);
  advance(g, 0.1);
  g.start();
  assert.equal(g.x, 0);
  assert.equal(g.steer, 0);
  assert.equal(g.heading, 0);
});
