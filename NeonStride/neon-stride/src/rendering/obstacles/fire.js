export function fireBar(scene, z, time) {
  for (const x of [-3.0, 3.0])
    scene.box(
      x,
      0.85,
      z,
      0.35,
      0.8,
      0.65,
      ["#773c26", "#422d29", "#b18045"],
      "#e2a66b",
    );
  scene.worldLine(
    [
      { x: -2.85, y: 1.5, z },
      { x: 2.85, y: 1.5, z },
    ],
    "#ff5426",
    0.42,
    18,
  );
  scene.worldLine(
    [
      { x: -2.85, y: 1.5, z: z - 0.02 },
      { x: 2.85, y: 1.5, z: z - 0.02 },
    ],
    "#ffe7a0",
    0.12,
    10,
  );
  for (let i = 0; i < 25; i++) {
    const x = -2.9 + i * 0.24,
      flicker = 0.5 + 0.5 * Math.sin(time * 24 + i * 2.3),
      p = (dx, y) => scene.project(x + dx, y, z - 0.05);
    scene.poly(
      [
        p(-0.16, 1.3),
        p(0, 1.7 + flicker * 0.55),
        p(0.17, 1.4),
        p(0.08, 1.05 + flicker * 0.12),
      ],
      i % 2 ? "#ffbc49cc" : "#ff6b27dd",
    );
    if (i % 3 === 0) {
      const s = scene.project(x, 2 + ((time * 2 + i * 0.21) % 1), z);
      scene.ctx.fillStyle = "#ffd293";
      scene.ctx.fillRect(s.x, s.y, 1.5, 3);
    }
  }
}
