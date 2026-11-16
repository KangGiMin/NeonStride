import test from "node:test";
import assert from "node:assert/strict";
import {
  runnerPose,
  runnerBodyPoint,
  runnerPhase,
  runnerFallPose,
} from "../dist/renderer.js";
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

test("three-dimensional limb lengths stay fixed throughout strides and jump transitions", () => {
  for (const air of [0, 0.25, 0.5, 0.75, 1])
    for (let i = 0; i < 240; i++) {
      const pose = runnerPose((i / 240) * tau, air);
      for (const leg of pose.legs) {
        assert.ok(Math.abs(distance(leg.hip, leg.knee) - 0.49) < 1e-8);
        assert.ok(Math.abs(distance(leg.knee, leg.foot) - 0.46) < 1e-8);
        assert.ok(leg.foot.y > 0);
        assert.ok(
          Math.abs(leg.foot.x) < 0.2,
          "feet stay underneath the pelvis",
        );
      }
      for (const arm of pose.arms) {
        const shoulder = runnerBodyPoint(pose, arm.shoulder),
          elbow = runnerBodyPoint(pose, arm.elbow),
          hand = runnerBodyPoint(pose, arm.hand);
        assert.ok(Math.abs(distance(shoulder, elbow) - 0.3) < 1e-8);
        assert.ok(Math.abs(distance(elbow, hand) - 0.28) < 1e-8);
        const upper = subtract(shoulder, elbow),
          fore = subtract(hand, elbow);
        const cosine =
          (upper.x * fore.x + upper.y * fore.y + upper.z * fore.z) /
          (length(upper) * length(fore));
        const bend =
          (Math.acos(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI;
        assert.ok(bend >= 80 - 1e-8 && bend <= 96 + 1e-8);
        assert.ok(
          Math.abs(arm.elbow.x - arm.shoulder.x) < 0.06,
          "upper arms swing near the ribs",
        );
        assert.ok(
          arm.elbow.y < arm.shoulder.y - 0.14,
          "elbows remain relaxed below the shoulders",
        );
      }
    }
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

test("arms counter-swing the legs and torso stays stable with a modest forward lean", () => {
  const pose = runnerPose(0);
  assert.ok(pose.legs[0].foot.z > 0 && pose.arms[0].elbow.z < 0);
  assert.ok(pose.arms[1].elbow.z > 0);
  for (let i = 0; i < 120; i++) {
    const p = runnerPose((i / 120) * tau),
      hip = runnerBodyPoint(p, { x: 0, y: 0.93, z: 0 }),
      neck = runnerBodyPoint(p, { x: 0, y: 1.4, z: 0 });
    const lean = (Math.atan2(neck.z - hip.z, neck.y - hip.y) * 180) / Math.PI;
    assert.ok(lean > 6 && lean < 10);
    assert.ok(Math.abs(p.roll) < 0.02);
    assert.ok(Math.abs(p.twist) <= 0.06);
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
