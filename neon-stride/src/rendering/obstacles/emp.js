export function empZone(scene, obstacle, z, progress, time) {
  const end = z + obstacle.length;
  scene.quad(-3.1, 3.1, Math.max(-3, z), end, 0.025, "#9a70ef24", "#bd96ff66");
  for (let i = 0; i <= 8; i++) {
    const d = z + (obstacle.length * i) / 8;
    if (d < -3) continue;
    scene.worldLine(
      [
        { x: -3, y: 0.05, z: d },
        { x: -1.5, y: 0.18 + Math.sin(time * 8 + i) * 0.1, z: d + 0.3 },
        { x: 0, y: 0.05, z: d },
        { x: 1.5, y: 0.18, z: d - 0.3 },
        { x: 3, y: 0.05, z: d },
      ],
      "#c59aff80",
      0.025,
      3,
    );
  }
  for (const x of [-3.35, 3.35])
    scene.box(
      x,
      0,
      z,
      0.2,
      1.2,
      0.3,
      ["#473a66", "#1c1b34", "#c29bff"],
      "#c49aff",
    );
}
