import test from "node:test";
import assert from "node:assert/strict";
import { monsterAttackPose } from "../../src/animation/monster-attack.js";
import { MONSTER } from "../../src/config/monster.js";

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

test("monster winds up, accelerates across the lane at contact, and follows through", () => {
  const wound = monsterAttackPose(MONSTER.strikeStart);
  const middle = monsterAttackPose((1 + MONSTER.strikeStart) / 2);
  const hit = monsterAttackPose(1);
  const follow = monsterAttackPose(1 + 0.2 / 1.8);
  assert.ok(
    wound.angle > 1.8,
    "bat is drawn behind the body before the strike",
  );
  assert.ok(
    middle.angle - hit.angle > 2 * (wound.angle - middle.angle),
    "strike speeds up towards impact",
  );
  assert.ok(
    distance(wound.tip, hit.tip) > 6,
    "tip travels through a full swing",
  );
  assert.ok(
    hit.grip.x > 0 && hit.tip.x < 0,
    "bat crosses the runner's lane at impact",
  );
  assert.ok(Math.abs(hit.grip.y - MONSTER.batHeight) < 1e-10);
  assert.ok(hit.grip.y + MONSTER.barrelRadius <= MONSTER.hitTop);
  assert.ok(follow.angle < -0.5 && follow.tip.z < hit.tip.z);
  assert.ok(Math.abs(wound.twist - hit.twist) > 0.6, "torso drives the swing");
});

test("both hands keep their grip and monster arm and bat lengths remain fixed", () => {
  for (let i = 1; i <= 140; i++) {
    const pose = monsterAttackPose(i / 100);
    assert.ok(
      Math.abs(distance(pose.grip, pose.tip) - MONSTER.batLength) < 1e-10,
    );
    for (const [index, arm] of pose.arms.entries()) {
      assert.ok(
        Math.abs(distance(arm.shoulder, arm.elbow) - MONSTER.upperArm) < 1e-10,
      );
      assert.ok(
        Math.abs(distance(arm.elbow, arm.hand) - MONSTER.forearm) < 1e-10,
      );
      assert.ok(
        Math.abs(distance(pose.grip, arm.hand) - (index === 0 ? 0.34 : 0)) <
          1e-10,
      );
    }
  }
  assert.deepEqual(
    monsterAttackPose(0.9),
    monsterAttackPose(0.9),
    "paused attack pose is deterministic",
  );
});
