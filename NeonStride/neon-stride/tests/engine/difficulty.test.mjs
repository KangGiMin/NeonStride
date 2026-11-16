import test from "node:test";
import assert from "node:assert/strict";
import {
  Runner,
  DIFFICULTIES,
  obstacleSpec,
  isPit,
  hazardProgress,
} from "../../src/engine.js";
import { advance, empty, obstacle } from "../fixtures/engine.js";

for (const difficulty of Object.keys(DIFFICULTIES))
  test(`${difficulty}: autoplayer survives 10 minutes across all eight types`, () => {
    let seed = 42;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const g = new Runner(random);
    g.start(difficulty);
    let doubleAt = null;
    const seen = new Set();
    for (let t = 0; t < 600 * 120; t++) {
      const next = g.obstacles.find(
        (o) => !o.passed && o.position + o.length > g.distance,
      );
      if (next) {
        const seconds = (next.position - g.distance) / g.speed;
        const spec = obstacleSpec(next),
          needsDouble = isPit(next.type) || spec.height > 1.35;
        const jumpLead =
          next.type === "collapse" ? 0.23 : spec.height > 1.35 ? 0.46 : 0.29;
        if (seconds < jumpLead && seconds > 0 && g.jumps === 0) {
          seen.add(next.type);
          if (spec.kind === "slide") g.slide();
          else {
            g.jump();
            doubleAt = needsDouble ? g.elapsed + 0.19 : null;
          }
        }
      }
      if (doubleAt !== null && g.elapsed >= doubleAt) {
        g.jump();
        doubleAt = null;
      }
      g.update(1 / 120);
      assert.equal(
        g.status,
        "running",
        `failed ${g.reason} at ${g.elapsed.toFixed(2)}s in ${difficulty}`,
      );
      assert.ok(g.obstacles.length < 16);
    }
    assert.equal(g.score, 6000);
    assert.equal(g.speed, DIFFICULTIES[difficulty].maxSpeed);
    assert.ok(g.cleared > 150);
    assert.equal(seen.size, 8);
    assert.ok(g.sequence > 150);
  });

test("four difficulties increase speed, shorten reaction time, and preserve restart mode", () => {
  let previous = 0,
    previousLead = Infinity;
  for (const [difficulty, config] of Object.entries(DIFFICULTIES)) {
    const g = new Runner(() => 0.5);
    g.start(difficulty);
    assert.equal(g.speed, config.initialSpeed);
    assert.ok(g.speed > previous);
    assert.ok(config.eventLead < previousLead);
    previous = g.speed;
    previousLead = config.eventLead;
    g.end("low");
    g.start();
    assert.equal(g.difficulty, difficulty);
    assert.equal(g.speed, config.initialSpeed);
  }
});

test("hazard activation follows distance and stays frozen while paused", () => {
  const g = new Runner(() => 0.5);
  g.start("hard");
  const o = { position: g.distance + g.speed * 0.5 };
  const p = hazardProgress(o, g.distance, g.speed, g.difficulty);
  assert.ok(p > 0 && p < 1);
  g.pause();
  g.update(5);
  assert.equal(hazardProgress(o, g.distance, g.speed, g.difficulty), p);
  assert.equal(hazardProgress(o, o.position, g.speed, g.difficulty), 1);
});
