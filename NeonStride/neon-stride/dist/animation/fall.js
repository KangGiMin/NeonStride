import { runnerPose } from "./pose.js";

export function runnerFallPose(phase, time) {
  const reach = Math.min(1, Math.max(0, time) / 0.25);
  const pose = runnerPose(phase, Math.min(1, Math.max(0, time) / 0.12));
  pose.lean += reach * 0.25;
  pose.roll += Math.sin(time * 7) * 0.08 * reach;
  pose.twist += Math.sin(time * 4) * 0.08 * reach;
  pose.arms = pose.arms.map((arm) => {
    const angle = arm.side * (0.95 + Math.sin(time * 9) * 0.1) * reach;
    const rotate = (point) => {
      const x = point.x - arm.shoulder.x,
        y = point.y - arm.shoulder.y;
      return {
        x: arm.shoulder.x + x * Math.cos(angle) - y * Math.sin(angle),
        y: arm.shoulder.y + x * Math.sin(angle) + y * Math.cos(angle),
        z: point.z,
      };
    };
    return { ...arm, elbow: rotate(arm.elbow), hand: rotate(arm.hand) };
  });
  pose.legs = pose.legs.map((leg) => {
    const angle = Math.sin(time * 6 + leg.side) * 0.16 * reach;
    const rotate = (point) => {
      const y = point.y - leg.hip.y,
        z = point.z - leg.hip.z;
      return {
        x: point.x,
        y: leg.hip.y + y * Math.cos(angle) - z * Math.sin(angle),
        z: leg.hip.z + y * Math.sin(angle) + z * Math.cos(angle),
      };
    };
    return {
      ...leg,
      knee: rotate(leg.knee),
      foot: rotate(leg.foot),
      bootPitch: leg.bootPitch + angle,
    };
  });
  return pose;
}
