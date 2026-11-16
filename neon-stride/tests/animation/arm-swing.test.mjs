import test from "node:test";
import assert from "node:assert/strict";
import { runnerPose } from "../../src/renderer.js";

test("running arms have a wider forward/backward sweep while jumping keeps a stable tuck", () => {
  const poses = Array.from({ length: 240 }, (_, i) =>
    runnerPose((i / 240) * Math.PI * 2),
  );
  for (const side of [0, 1]) {
    for (const [joint, minimum] of [
      ["elbow", 0.5],
      ["hand", 0.52],
    ]) {
      const depths = poses.map((pose) => pose.arms[side][joint].z);
      assert.ok(
        Math.max(...depths) - Math.min(...depths) > minimum,
        `${joint} swing is visibly larger`,
      );
    }
  }
  const airborne = runnerPose(0, 1);
  for (const phase of [0.4, 1.2, 2.5, 4.7]) {
    const pose = runnerPose(phase, 1);
    for (const side of [0, 1]) {
      const a = pose.arms[side].hand,
        b = airborne.arms[side].hand;
      assert.ok(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < 1e-10);
    }
  }
});
