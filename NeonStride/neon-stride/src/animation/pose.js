import { createLeg } from "./legs.js";
import { createArm } from "./arms.js";

export function runnerPhase(distance, time) {
  return distance * 0.045 + time * 10.8;
}

export function runnerPose(phase, airborne = false) {
  const air = Math.max(0, Math.min(1, Number(airborne)));
  const mix = (ground, jump) => ground + (jump - ground) * air;
  const bob = mix(0.012 + (0.035 * (1 + Math.cos(phase * 2 + 0.55))) / 2, 0);
  const sway = mix(Math.sin(phase) * 0.012, 0);
  const pelvisYaw = mix(Math.cos(phase) * 0.04, 0);
  const pelvisHeight = 0.88 + bob;
  const legs = [-1, 1].map((side) =>
    createLeg(phase, side, { mix, air, sway, pelvisYaw, pelvisHeight }),
  );
  const arms = legs.map((leg) => createArm(leg, mix));
  return {
    bob,
    sway,
    pelvisHeight,
    lean: (mix(8 + 0.5 * Math.sin(phase * 2), 8) * Math.PI) / 180,
    roll: mix(Math.sin(phase + 0.3) * 0.018, 0),
    twist: mix(-Math.cos(phase) * 0.06, 0),
    legs,
    arms,
  };
}
