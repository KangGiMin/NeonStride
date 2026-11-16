import { sampleStride } from "./stride.js";

export function createLeg(
  phase,
  side,
  { mix, air, sway, pelvisYaw, pelvisHeight },
) {
  const angle = phase + (side === 1 ? Math.PI : 0);
  const cycle = (((angle / (Math.PI * 2)) % 1) + 1) % 1;
  const stride = sampleStride(cycle);
  const bootPitch = mix(stride.pitch, 0.25);
  // Heel and toe rolls keep the supporting sole above the road.
  const soleClearance =
    0.01 +
    0.045 * Math.cos(bootPitch) +
    Math.max(0.24 * Math.sin(bootPitch), -0.12 * Math.sin(bootPitch));
  const lift = mix(Math.max(0, Math.min(1, (stride.y - 0.055) / 0.45)), 0.3);
  const hip = {
    x: side * 0.15 * Math.cos(pelvisYaw) + sway,
    y: pelvisHeight,
    z: -side * 0.15 * Math.sin(pelvisYaw),
  };
  const foot = {
    x: side * (0.17 - lift * 0.012),
    y: mix(Math.max(stride.y, soleClearance), side === -1 ? 0.34 : 0.22),
    z: mix(stride.z, side * 0.24),
  };
  const dx = foot.x - hip.x,
    dy = foot.y - hip.y,
    dz = foot.z - hip.z;
  const length = Math.hypot(dx, dy, dz);
  const distance = Math.max(0.001, Math.min(length, 0.949));
  const along = (0.49 ** 2 - 0.46 ** 2 + distance ** 2) / (2 * distance);
  const bend = Math.sqrt(Math.max(0, 0.49 ** 2 - along ** 2));
  const axis = { x: dx / length, y: dy / length, z: dz / length };
  const forward = {
    x: -axis.x * axis.z,
    y: -axis.y * axis.z,
    z: 1 - axis.z ** 2,
  };
  const forwardLength = Math.hypot(forward.x, forward.y, forward.z);
  const knee = {
    x: hip.x + axis.x * along + (forward.x / forwardLength) * bend,
    y: hip.y + axis.y * along + (forward.y / forwardLength) * bend,
    z: hip.z + axis.z * along + (forward.z / forwardLength) * bend,
  };
  return {
    side,
    hip,
    knee,
    foot,
    lift,
    bootPitch,
    contact: air < 0.01 && cycle <= 0.38,
    armSwing: mix(-0.65 * Math.cos(angle - 0.3), side * 0.25),
    angle,
  };
}
