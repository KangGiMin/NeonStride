import { MONSTER } from "../../config/monster.js";
import { batPoint, monsterAttackPose } from "../../animation/monster-attack.js";

export function drawBatTrail(scene, z, progress, lead) {
  if (progress <= MONSTER.strikeStart || progress > 1 + 0.16 / lead) return;
  const c = scene.ctx;
  c.save();
  for (const [i, age] of [0.025, 0.05, 0.08].entries()) {
    const pose = monsterAttackPose(progress - age / lead, lead);
    const points = [batPoint(pose, 1.1), pose.tip].map((point) => ({
      ...point,
      z: point.z + z,
    }));
    c.globalAlpha = 0.22 - i * 0.06;
    scene.worldLine(points, "#f5e3ae", 0.17, 4);
  }
  c.restore();
}

export function drawMonsterBat(scene, z, pose) {
  const point = (distance) => {
    const p = batPoint(pose, distance);
    return { ...p, z: p.z + z };
  };
  scene.worldLine([point(-0.32), point(MONSTER.batLength)], "#6e472d", 0.2);
  scene.worldLine(
    [point(0.85), point(MONSTER.batLength)],
    "#b19068",
    MONSTER.barrelRadius * 2,
    2,
  );
  scene.worldLine([point(-0.32), point(0.72)], "#392c24", 0.21);
  for (const distance of [1.15, 3.8]) {
    const p = point(distance);
    scene.worldLine(
      [
        { ...p, y: p.y - 0.29 },
        { ...p, y: p.y + 0.29 },
      ],
      "#8b9da0",
      0.08,
    );
  }
  for (const { hand } of pose.arms) {
    scene.box(
      hand.x,
      hand.y - 0.13,
      hand.z + z - 0.13,
      0.26,
      0.26,
      0.26,
      ["#91a773", "#53674a", "#b0bb83"],
      "#c5d69966",
    );
    scene.worldLine(
      [
        { ...hand, y: hand.y - 0.05, z: hand.z + z - 0.15 },
        { ...hand, y: hand.y + 0.06, z: hand.z + z - 0.15 },
      ],
      "#48543a",
      0.035,
    );
  }
}
