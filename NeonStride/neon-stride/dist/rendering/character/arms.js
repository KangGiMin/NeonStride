export function drawArm(scene, arm, p, shadow) {
  const c = scene.ctx;

  const shoulder = p(arm.shoulder.x, arm.shoulder.y, arm.shoulder.z);
  const elbow = p(arm.elbow.x, arm.elbow.y, arm.elbow.z);
  const hand = p(arm.hand.x, arm.hand.y, arm.hand.z);
  scene.line([shoulder, elbow], "#385667", shadow.k * 0.15);
  scene.line([elbow, hand], "#203b50", shadow.k * 0.12);
  scene.line([elbow, hand], "#9ceec8", shadow.k * 0.025, 4);
  c.fillStyle = "#7295a0";
  c.beginPath();
  c.arc(elbow.x, elbow.y, shadow.k * 0.065, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#6b9da8";
  c.beginPath();
  c.arc(hand.x, hand.y, shadow.k * 0.067, 0, Math.PI * 2);
  c.fill();
}
