export function createArm({ side, armSwing, angle }, mix) {
  const direction = {
    x: side * 0.16,
    y: -Math.cos(armSwing),
    z: Math.sin(armSwing),
  };
  const norm = Math.hypot(direction.x, direction.y, direction.z);
  const upper = {
    x: direction.x / norm,
    y: direction.y / norm,
    z: direction.z / norm,
  };
  const shoulder = { x: side * 0.29, y: 1.36, z: 0 };
  const elbow = {
    x: shoulder.x + upper.x * 0.3,
    y: shoulder.y + upper.y * 0.3,
    z: shoulder.z + upper.z * 0.3,
  };
  const normal = { x: 0, y: Math.sin(armSwing), z: Math.cos(armSwing) };
  const flex = (mix(88 + 8 * Math.sin(angle + 0.25), 88) * Math.PI) / 180;
  const bendAngle = Math.PI - flex;
  const hand = {
    x:
      elbow.x +
      0.28 * (upper.x * Math.cos(bendAngle) + normal.x * Math.sin(bendAngle)),
    y:
      elbow.y +
      0.28 * (upper.y * Math.cos(bendAngle) + normal.y * Math.sin(bendAngle)),
    z:
      elbow.z +
      0.28 * (upper.z * Math.cos(bendAngle) + normal.z * Math.sin(bendAngle)),
  };
  return { side, shoulder, elbow, hand };
}
