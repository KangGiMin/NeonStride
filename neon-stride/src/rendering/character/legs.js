export function drawLegs(scene, pose, joint, shadow, paintBoot) {
  const c = scene.ctx;
  for (const leg of [...pose.legs].sort((a, b) => b.foot.z - a.foot.z)) {
    const hip = joint(leg.hip),
      knee = joint(leg.knee),
      foot = joint(leg.foot);
    scene.line([hip, knee], "#152538", shadow.k * 0.17);
    scene.line([knee, foot], "#283f50", shadow.k * 0.14);
    scene.line([hip, knee], "#567b8b", shadow.k * 0.045);
    c.fillStyle = "#7295a0";
    c.beginPath();
    c.arc(knee.x, knee.y, shadow.k * 0.075, 0, Math.PI * 2);
    c.fill();
    scene.line(
      [knee, { x: foot.x, y: foot.y - shadow.k * 0.06 }],
      "#78c6d1",
      shadow.k * 0.035,
      3,
    );
    if (leg.lift < 0.5) paintBoot(leg);
  }
}
