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
          arm.elbow.y < arm.shoulder.y - 0.2,
          "elbows remain relaxed below the shoulders",
        );
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
