export function monster(scene, o, z, progress) {
  if (progress <= 0) return;
  const rise = Math.min(1, progress / 0.25),
    y = (1 - rise) * -2.8;
  const c = scene.ctx;
  scene.box(
    3.65,
    y + 0.65,
    z,
    0.95,
    1.25,
    0.65,
    ["#536349", "#293d34", "#78816a"],
    "#8eac6f",
  );
  for (const side of [-1, 1])
    scene.worldLine(
      [
        { x: 3.65 + side * 0.29, y: y + 0.85, z: z + 0.2 },
        { x: 3.65 + side * 0.42, y: y + 0.05, z: z - 0.12 },
      ],
      "#344239",
      0.3,
    );
  scene.box(
    3.52,
    y + 1.93,
    z - 0.1,
    0.84,
    0.68,
    0.65,
    ["#788963", "#384d3e", "#9daa7e"],
    "#bad18a",
  );
  for (const x of [3.29, 3.69])
    scene.box(
      x,
      y + 2.29,
      z - 0.13,
      0.15,
      0.08,
      0.02,
      ["#ff544e", "#861d21", "#ffc47e"],
      "#ffb077",
    );
  scene.worldLine(
    [
      { x: 3.19, y: y + 2.05, z: z - 0.14 },
      { x: 3.84, y: y + 2.05, z: z - 0.14 },
    ],
    "#101b17",
    0.1,
  );
  for (const x of [3.31, 3.52, 3.73])
    scene.worldLine(
      [
        { x, y: y + 2.1, z: z - 0.15 },
        { x, y: y + 1.99, z: z - 0.15 },
      ],
      "#e5d7a7",
      0.045,
    );
  const swing = Math.max(0, Math.min(1, (progress - 0.3) / 0.7));
  const angle = -1.5 + (1 - (1 - swing) ** 3) * 1.5;
  const grip = { x: 2.75, y: y + 1.57, z: z + 0.1 };
  scene.worldLine(
    [
      { x: 3.25, y: y + 1.7, z: z + 0.1 },
      { x: 2.9, y: y + 1.25, z: z + 0.45 },
      grip,
    ],
    "#788b60",
    0.25,
  );
  const tip = {
    x: grip.x - Math.cos(angle) * 3.85,
    y: y + 1.57,
    z: grip.z + Math.sin(angle) * 3.85,
  };
  scene.worldLine([grip, tip], "#6e472d", 0.22);
  scene.worldLine(
    [
      {
        x: grip.x + (tip.x - grip.x) * 0.36,
        y: grip.y,
        z: grip.z + (tip.z - grip.z) * 0.36,
      },
      tip,
    ],
    "#b19068",
    0.35,
    2,
  );
  if (progress > 0.65 && progress < 1) {
    c.globalAlpha = 0.28;
    scene.worldLine(
      [{ x: grip.x - 1, y: grip.y + 0.06, z: z - 0.7 }, tip],
      "#f5e3ae",
      0.09,
      5,
    );
    c.globalAlpha = 1;
  }
}
