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
import { createAutoplayer } from "../fixtures/autoplayer.js";
import { nearCorner } from "../../src/game/navigation/route.js";

for (const difficulty of Object.keys(DIFFICULTIES))
  test(`${difficulty}: autoplayer survives 10 minutes across thirteen hazards and random corners`, () => {
    let seed = 42;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const g = new Runner(random);
    g.start(difficulty);
    const { play, seen } = createAutoplayer();
    for (let t = 0; t < 600 * 120; t++) {
      play(g);
      g.update(1 / 120);
      assert.equal(
        g.status,
        "running",
        `failed ${g.reason} at ${g.elapsed.toFixed(2)}s in ${difficulty}`,
      );
      assert.ok(g.obstacles.length < 16);
      if (t % 120 === 0)
        for (const obstacle of g.obstacles.filter(
          (o) => o.position > g.distance,
        ))
          assert.equal(
            nearCorner(
              g,
              obstacle.position,
              obstacle.position + obstacle.length,
            ),
            false,
            "hazards stay outside reserved corners",
          );
    }
    assert.equal(g.score, 6000);
    assert.equal(g.speed, DIFFICULTIES[difficulty].maxSpeed);
    assert.ok(g.cleared > 90);
    assert.equal(seen.size, 13);
    assert.ok(g.turnsCompleted > 20);
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
