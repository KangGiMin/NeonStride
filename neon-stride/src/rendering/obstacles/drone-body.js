export function drawDrone(scene, x, y, z, color = "#ff8c83", hover = false) {
  scene.box(x, y, z, 0.9, 0.32, 0.65, ["#496073", "#192e41", "#8a9fac"], color);
  scene.worldLine(
    [
      { x: x - 0.6, y: y + 0.12, z: z + 0.3 },
      { x: x + 0.6, y: y + 0.12, z: z + 0.3 },
    ],
    color,
    0.06,
    8,
  );
  scene.worldLine(
    [
      { x, y: y + 0.16, z: z - 0.03 },
      { x, y: y + 0.16, z: z - 0.08 },
    ],
    "#fff0d7",
    0.11,
    10,
  );
  for (const side of [-1, 1]) {
    scene.box(x + side * 0.65, y + 0.1, z + 0.12, 0.3, 0.13, 0.4, [
      "#2b4354",
      "#162632",
      color,
    ]);
    if (!hover)
      scene.worldLine(
        [
          { x: x + side * 0.85, y: y + 0.25, z: z - 0.12 },
          { x: x + side * 0.4, y: y + 0.25, z: z + 0.55 },
        ],
        "#b1d4df99",
        0.05,
      );
    else
      scene.worldLine(
        [
          { x: x + side * 0.45, y: y - 0.1, z: z + 0.2 },
          { x: x + side * 0.45, y: y - 0.45, z: z + 0.2 },
        ],
        "#7debf9",
        0.1,
        7,
      );
  }
}
