import test from "node:test";
import assert from "node:assert/strict";
import { DIFFICULTIES } from "../../src/engine.js";
import { HAZARDS } from "../../src/config/hazards.js";
import { createStrikes, patrolX } from "../../src/game/obstacles/dynamic.js";
import { empty, advance, obstacle } from "../fixtures/engine.js";
import { createAutoplayer } from "../fixtures/autoplayer.js";

for (const [mode, config] of Object.entries(DIFFICULTIES)) {
  test(`${mode}: energy beam requires a double jump at both starting and maximum speed`, () => {
    for (const speed of [config.initialSpeed, config.maxSpeed])
      for (const action of ["ground", "slide", "single", "double"]) {
        const g = empty();
        g.difficulty = mode;
        g.speed = speed;
        g.elapsed = (speed - config.initialSpeed) / config.acceleration;
        obstacle(g, "energy", speed * 0.46);
        if (action === "slide") g.slide();
        if (["single", "double"].includes(action)) g.jump();
        advance(g, 0.19);
        if (action === "double") g.jump();
        advance(g, 0.48);
        assert.equal(
          g.status,
          action === "double" ? "running" : "over",
          `${speed} ${action}`,
        );
      }
  });
  test(`${mode}: both shutter modes have the advertised safe posture`, () => {
    for (const variant of [1, 2])
      for (const correct of [false, true]) {
        const g = empty();
        g.difficulty = mode;
        g.speed = config.initialSpeed;
        obstacle(g, "shutter", g.speed * 0.36);
        g.obstacles[0].variant = variant;
        if (correct) variant === 1 ? g.slide() : g.jump();
        advance(g, 0.6);
        assert.equal(
          g.status,
          correct ? "running" : "over",
          `${variant} correct=${correct}`,
        );
      }
  });
}

test("EMP adds temporary interference without collisions, and freezes while paused", () => {
  const g = empty();
  obstacle(g, "emp", 0, g.speed);
  advance(g, 0.3);
  assert.equal(g.status, "running");
  assert.ok(g.empStrength > 0.9);
  assert.equal(g.score, 3);
  g.pause();
  const strength = g.empStrength;
  advance(g, 2);
  assert.equal(g.empStrength, strength);
  g.resume();
  advance(g, 0.9);
  assert.equal(g.empStrength, 0);
  assert.equal(g.status, "running");
});

test("patrol movement has constant lateral speed and reverses at both road edges", () => {
  const o = { phase: 0 },
    r = HAZARDS.patrolRange,
    v = HAZARDS.patrolSpeed;
  assert.equal(patrolX(o, 0), -r);
  assert.ok(Math.abs(patrolX(o, (2 * r) / v) - r) < 1e-8);
  assert.ok(Math.abs(patrolX(o, (4 * r) / v) + r) < 1e-8);
  assert.ok(Math.abs(patrolX(o, 0.4) - patrolX(o, 0.2) - v * 0.2) < 1e-8);
});

test("patrol drones and hover bots collide in their occupied corridor and leave safe side space", () => {
  for (const variant of [1, 2])
    for (const safe of [false, true]) {
      const g = empty();
      obstacle(g, "patrol", g.speed * 0.1);
      Object.assign(g.obstacles[0], {
        variant,
        phase: HAZARDS.patrolRange - HAZARDS.patrolSpeed * 0.1,
      });
      g.x = safe ? 2.35 : 0;
      advance(g, 0.3);
      assert.equal(g.status, safe ? "running" : "over");
    }
});

test("three airborne drones lock separate ground targets that do not follow the runner", () => {
  const g = empty();
  obstacle(g, "airstrike", g.speed * 2, g.speed * 1.5);
  const o = g.obstacles[0];
  o.strikes = createStrikes(o.position, g.speed);
  advance(g, 1);
  assert.equal(o.strikes[0].x, 0);
  assert.equal(o.strikes[1].x, null);
  g.move(1);
  advance(g, 0.35);
  g.move(0);
  assert.ok(g.x > 2);
  assert.equal(o.strikes[0].x, 0);
  const { play } = createAutoplayer();
  while (g.elapsed < 3.6 && g.status === "running") {
    play(g);
    g.update(1 / 120);
  }
  assert.equal(g.status, "running");
  assert.equal(o.strikes.length, 3);
  assert.ok(o.strikes.every((s) => s.x !== null));
  assert.ok(g.distance > o.strikes[2].position);
});

test("airborne laser targets require lateral evasion even if the runner jumps", () => {
  for (const jumping of [false, true]) {
    const g = empty();
    obstacle(g, "airstrike", g.speed * 1.5, g.speed * 1.5);
    advance(g, 1.15);
    if (jumping) g.jump();
    advance(g, 0.5);
    assert.equal(g.status, "over");
    assert.equal(g.reason, "airstrike");
  }
});
