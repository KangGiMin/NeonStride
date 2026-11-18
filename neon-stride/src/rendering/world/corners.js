export function cornerPads(scene) {
  if (!scene.view) return;
  const { game } = scene.view;
  for (const corner of game.corners) {
    const z = corner.position - game.distance;
    if (z < -10 || z > game.config.revealDistance) continue;
    const size = 3.55;
    scene.poly(
      [
        [-size, -size],
        [size, -size],
        [size, size],
        [-size, size],
      ].map(([x, z]) =>
        scene.projectWorld(corner.worldX + x, -0.015, corner.worldZ + z),
      ),
      "#203240",
      "#e7ca6d80",
    );
  }
}

export function cornerSigns(scene, game) {
  const corner = game.corners.find((c) => !c.turned);
  if (!corner) return;
  const z = corner.position - game.distance;
  if (z < -2 || z > game.config.revealDistance) return;
  const point = scene.project(0, 2.7, z - 2);
  const c = scene.ctx,
    size = Math.max(14, Math.min(70, point.k * 0.8));
  c.save();
  c.font = `bold ${size}px sans-serif`;
  c.textAlign = "center";
  c.fillStyle = "#ffe175";
  c.shadowColor = "#ffc746";
  c.shadowBlur = 12;
  c.fillText(corner.direction === 1 ? "↱" : "↰", point.x, point.y);
  c.restore();
  const entry = Math.max(-2, z - game.speed * 0.6);
  scene.line(
    [scene.project(-3.05, 0.025, entry), scene.project(3.05, 0.025, entry)],
    "#ffe175",
    3,
    8,
  );
}
