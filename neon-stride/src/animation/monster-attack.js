import { MONSTER } from "../config/monster.js";
import { DIFFICULTIES, DEFAULT_DIFFICULTY } from "../config/difficulties.js";

const clamp = (value) => Math.max(0, Math.min(1, value));
const smooth = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
export const batPoint = (pose, distance) => ({
  x: pose.grip.x + pose.direction.x * distance,
  y: pose.grip.y + pose.direction.y * distance,
  z: pose.grip.z + pose.direction.z * distance,
});

export function monsterBodyPoint(pose, point) {
  const cos = Math.cos(pose.twist),
    sin = Math.sin(pose.twist);
  return {
    x: MONSTER.centerX + pose.lean + point.x * cos + point.z * sin,
    y: pose.offsetY + point.y,
    z: -point.x * sin + point.z * cos,
  };
}

function elbowPoint(shoulder, hand, side) {
  const delta = {
    x: hand.x - shoulder.x,
    y: hand.y - shoulder.y,
    z: hand.z - shoulder.z,
  };
  const distance = Math.hypot(delta.x, delta.y, delta.z);
  const axis = {
    x: delta.x / distance,
    y: delta.y / distance,
    z: delta.z / distance,
  };
  const preferred = { x: side * 0.15, y: -1, z: 0.55 };
  const dot =
    preferred.x * axis.x + preferred.y * axis.y + preferred.z * axis.z;
  const bend = {
    x: preferred.x - axis.x * dot,
    y: preferred.y - axis.y * dot,
    z: preferred.z - axis.z * dot,
  };
  const norm = Math.hypot(bend.x, bend.y, bend.z);
  const along =
    (MONSTER.upperArm ** 2 - MONSTER.forearm ** 2 + distance ** 2) /
    (2 * distance);
  const height = Math.sqrt(Math.max(0, MONSTER.upperArm ** 2 - along ** 2));
  return Object.fromEntries(
    ["x", "y", "z"].map((key) => [
      key,
      shoulder[key] + axis[key] * along + (bend[key] / norm) * height,
    ]),
  );
}

// Progress 1 is the collision plane. After that, continue the follow-through.
export function monsterAttackPose(
  progress,
  leadSeconds = DIFFICULTIES[DEFAULT_DIFFICULTY].eventLead,
) {
  const p = clamp(progress);
  const windup = smooth((p - 0.12) / (MONSTER.strikeStart - 0.12));
  const strike =
    clamp((p - MONSTER.strikeStart) / (1 - MONSTER.strikeStart)) ** 2;
  const after = Math.max(0, progress - 1) * leadSeconds;
  const follow = smooth((after - MONSTER.impactHold) / MONSTER.followDuration);
  const angle = (1.2 + windup * 0.75) * (1 - strike) - follow * 0.7;
  const elevation = 0.08 * windup * (1 - strike) - follow * 0.04;
  const pose = {
    windup,
    strike,
    follow,
    angle,
    offsetY: (1 - smooth(p / 0.25)) * -2.8,
    twist: windup * 0.55 - strike * 0.7 - follow * 0.25,
    lean: windup * 0.1 - strike * 0.28 - follow * 0.1,
    direction: {
      x: -Math.cos(angle) * Math.cos(elevation),
      y: Math.sin(elevation),
      z: Math.sin(angle) * Math.cos(elevation),
    },
  };
  pose.grip = {
    x: MONSTER.centerX - 0.62 + windup * 0.18 - strike * 0.5 - follow * 0.16,
    y:
      pose.offsetY +
      MONSTER.batHeight +
      windup * (1 - strike) * 0.28 -
      follow * 0.12,
    z: windup * 0.35 - strike * 0.35 - follow * 0.12,
  };
  pose.butt = batPoint(pose, -0.32);
  pose.tip = batPoint(pose, MONSTER.batLength);
  pose.arms = [-1, 1].map((side) => {
    const shoulder = monsterBodyPoint(pose, {
      x: side * 0.43,
      y: 1.75,
      z: 0.15,
    });
    const hand = batPoint(pose, side === -1 ? 0.34 : 0);
    return { shoulder, elbow: elbowPoint(shoulder, hand, side), hand };
  });
  return pose;
}
