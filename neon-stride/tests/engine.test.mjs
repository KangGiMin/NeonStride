import test from "node:test";
import assert from "node:assert/strict";
import {
  Runner,
  RULES,
  DIFFICULTIES,
  OBSTACLES,
  obstacleSpec,
  isPit,
  hazardProgress,
} from "../dist/engine.js";
const advance = (g, time) => {
  for (let t = 0; t < time - 1e-8; t += 1 / 120)
    g.update(Math.min(1 / 120, time - t));
};
const empty = () => {
  const g = new Runner(() => 0.5);
  g.start();
  g.obstacles = [];
  g.nextPosition = 1e9;
  return g;
};
const obstacle = (g, type, z = 3, length = 1.25) => {
  g.obstacles = [
    { type, position: g.distance + z, length, id: 0, passed: false },
  ];
};
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

test("every obstacle type can appear first, including after restarting", () => {
  const types = [
    "low",
    "monster",
    "trees",
    "fire",
    "collapse",
    "bar",
    "high",
    "gap",
  ];
  for (const [index, type] of types.entries()) {
    const g = new Runner(() => (index + 0.5) / types.length);
    g.start();
    assert.equal(g.obstacles[0].type, type);
    g.end(type);
    g.start();
    assert.equal(g.obstacles[0].type, type);
    assert.ok(
      g.obstacles.every((o) => o.type === type),
      "no fixed introductory sequence",
    );
  }
});

test("consecutive runs draw fresh obstacle orders and spacings", () => {
  let seed = 42;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const g = new Runner(random);
  g.start();
  const first = g.obstacles.slice(0, 5).map((o) => o.type);
  const positions = g.obstacles.slice(0, 5).map((o) => o.position);
  g.end("low");
  g.start();
  assert.notDeepEqual(
    g.obstacles.slice(0, 5).map((o) => o.type),
    first,
  );
  assert.notDeepEqual(
    g.obstacles.slice(0, 5).map((o) => o.position),
    positions,
  );
});
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
test("monster and horizontal fire can be ducked at face height", () => {
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

test("missed pits animate a downward fall before game over while run statistics freeze", () => {
  for (const type of ["gap", "collapse"]) {
    const g = empty();
    advance(g, 2);
    obstacle(g, type, -0.1, 12);
    g.update(1 / 120);
    assert.equal(g.status, "falling");
    assert.equal(g.reason, type);
    const stopped = {
      score: g.score,
      elapsed: g.elapsed,
      distance: g.distance,
      cleared: g.cleared,
    };
    let previousY = g.y,
      previousVy = g.vy;
    for (let i = 0; i < 7; i++) {
      g.update(0.1);
      assert.equal(g.status, "falling");
      assert.ok(g.y < previousY);
      assert.ok(g.vy < previousVy);
      assert.equal(g.jump(), false);
      assert.equal(g.slide(), false);
      g.pause();
      assert.equal(g.status, "falling");
      assert.deepEqual(
        {
          score: g.score,
          elapsed: g.elapsed,
          distance: g.distance,
          cleared: g.cleared,
        },
        stopped,
      );
      previousY = g.y;
      previousVy = g.vy;
    }
    assert.ok(g.y < -5, "runner drops well below the road surface");
    g.update(0.3);
    assert.equal(g.status, "over");
    assert.equal(g.fallTime, RULES.fallDuration);
    assert.equal(g.score, stopped.score);
    const finalY = g.y;
    g.update(10);
    assert.equal(g.y, finalY);
    g.start();
    assert.equal(g.y, 0);
    assert.equal(g.vy, 0);
    assert.equal(g.fallTime, 0);
    assert.equal(g.score, 0);
  }
});
