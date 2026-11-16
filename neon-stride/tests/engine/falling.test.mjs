import test from "node:test";
import assert from "node:assert/strict";
import { RULES } from "../../src/engine.js";
import { advance, empty, obstacle } from "../fixtures/engine.js";

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
