export function runnerBodyPoint(pose, point) {
  const y = point.y - 0.93,
    cos = Math.cos(pose.lean),
    sin = Math.sin(pose.lean);
  const leanedY = y * cos - point.z * sin,
    leanedZ = y * sin + point.z * cos;
  const turnedX =
    point.x * Math.cos(pose.twist) + leanedZ * Math.sin(pose.twist);
  const turnedZ =
    -point.x * Math.sin(pose.twist) + leanedZ * Math.cos(pose.twist);
  return {
    x:
      turnedX * Math.cos(pose.roll) - leanedY * Math.sin(pose.roll) + pose.sway,
    y:
      pose.pelvisHeight +
      turnedX * Math.sin(pose.roll) +
      leanedY * Math.cos(pose.roll),
    z: turnedZ,
  };
}
