import test from "node:test";
import assert from "node:assert/strict";
import {
  runnerPose,
  runnerBodyPoint,
  runnerPhase,
  runnerFallPose,
} from "../../src/renderer.js";

const tau = Math.PI * 2;
const subtract = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const length = (p) => Math.hypot(p.x, p.y, p.z);
const distance = (a, b) => length(subtract(a, b));

test("falling pose reaches out and tumbles without continuing the running stride or stretching limbs", () => {
  for (const time of [0, 0.1, 0.25, 0.5, 0.8]) {
    const pose = runnerFallPose(1, time);
    for (const leg of pose.legs) {
      assert.ok(Math.abs(distance(leg.hip, leg.knee) - 0.49) < 1e-8);
      assert.ok(Math.abs(distance(leg.knee, leg.foot) - 0.46) < 1e-8);
    }
    for (const arm of pose.arms) {
      assert.ok(Math.abs(distance(arm.shoulder, arm.elbow) - 0.3) < 1e-8);
      assert.ok(Math.abs(distance(arm.elbow, arm.hand) - 0.28) < 1e-8);
    }
  }
  const balanced = runnerFallPose(1, 0),
    reaching = runnerFallPose(1, 0.4);
  assert.ok(reaching.lean > balanced.lean);
  assert.ok(
    Math.abs(reaching.arms[0].elbow.x) >
      Math.abs(balanced.arms[0].elbow.x) + 0.1,
  );
});
