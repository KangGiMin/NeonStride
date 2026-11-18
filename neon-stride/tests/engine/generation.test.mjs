import test from "node:test";
import assert from "node:assert/strict";
import { Runner } from "../../src/engine.js";
import { advance, empty, obstacle } from "../fixtures/engine.js";

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
    "energy",
    "emp",
    "patrol",
    "shutter",
    "airstrike",
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
