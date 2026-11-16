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

test("support foot follows the ground, rolls onto its toe, and recovers at moderate height", () => {
  for (let i = 0; i <= 38; i++) {
    const leg = runnerPose((i / 100) * tau).legs[0];
    assert.ok(leg.contact);
    const soleBottom =
      leg.foot.y -
      0.045 * Math.cos(leg.bootPitch) -
      Math.max(0.24 * Math.sin(leg.bootPitch), -0.12 * Math.sin(leg.bootPitch));
    assert.ok(
      Math.abs(soleBottom - 0.01) < 1e-8,
      "supporting sole stays on the road",
    );
  }
  assert.ok(
    runnerPose(0).legs[0].foot.z > runnerPose(0.38 * tau).legs[0].foot.z + 0.6,
    "foot travels backward during support",
  );
  const recovery = runnerPose(0.7 * tau).legs[0];
  assert.ok(
    recovery.foot.y > 0.4 && recovery.foot.y < 0.6,
    "heel recovery has a restrained lift",
  );
  let flight = false;
  for (let i = 0; i < 120; i++)
    if (runnerPose((i / 120) * tau).legs.every((leg) => !leg.contact))
      flight = true;
  assert.ok(flight, "a short flight separates left and right support phases");
});

test("stride loops smoothly without snapping at contacts or keyframe boundaries", () => {
  const epsilon = 1e-5;
  for (const cycle of [0, 0.38, 0.52, 0.7, 0.88, 1]) {
    const before = runnerPose(cycle * tau - epsilon),
      at = runnerPose(cycle * tau),
      after = runnerPose(cycle * tau + epsilon);
    for (let i = 0; i < 2; i++) {
      for (const joint of ["hip", "knee", "foot"])
        assert.ok(
          distance(before.legs[i][joint], after.legs[i][joint]) < 0.001,
        );
      const velocityBefore = subtract(at.legs[i].foot, before.legs[i].foot);
      const velocityAfter = subtract(after.legs[i].foot, at.legs[i].foot);
      assert.ok(
        distance(velocityBefore, velocityAfter) / epsilon < 0.003,
        "foot velocity is continuous at gait keys",
      );
      assert.ok(distance(before.arms[i].hand, after.arms[i].hand) < 0.001);
    }
  }
});

test("cadence rises gently and stays believable even at the highest difficulty speed", () => {
  let previous = 0;
  for (const speed of [14, 19, 31, 48, 76]) {
    const cycles = (runnerPhase(speed, 1) - runnerPhase(0, 0)) / tau;
    assert.ok(cycles > 1.7 && cycles < 2.5);
    assert.ok(cycles > previous);
    previous = cycles;
  }
});
