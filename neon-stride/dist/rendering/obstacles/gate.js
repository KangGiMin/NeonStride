export function gate(scene, o, z) {
  for (const x of [-2.8, 2.8])
    scene.box(
      x,
      0,
      z,
      0.18,
      2.55,
      o.length,
      ["#3b3156", "#25273e", "#685976"],
      "#9f7ce488",
    );
  scene.box(
    0,
    1.0,
    z,
    5.6,
    1.5,
    o.length,
    ["#3b2851", "#251e3c", "#66437b"],
    "#d17bff99",
  );
  scene.line(
    [scene.project(-2.65, 1.03, z - 0.01), scene.project(2.65, 1.03, z - 0.01)],
    "#ec96ff",
    2,
    12,
  );
  for (let x = -2.3; x < 2.6; x += 0.7)
    scene.line(
      [
        scene.project(x, 1.35, z - 0.02),
        scene.project(x + 0.25, 1.6, z - 0.02),
        scene.project(x + 0.5, 1.35, z - 0.02),
      ],
      "#ce91e6bb",
      1.3,
    );
}
