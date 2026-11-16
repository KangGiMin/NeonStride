export function drawBoot(scene, leg, joint, shadow) {
  const co = Math.cos(leg.bootPitch),
    si = Math.sin(leg.bootPitch);
  const point = (x, y, z) =>
    joint({
      x: leg.foot.x + x,
      y: leg.foot.y + y * co - z * si,
      z: leg.foot.z + y * si + z * co,
    });
  const width = 0.105 + leg.lift * 0.025;
  const sole = [
    point(-width, -0.045, -0.12),
    point(width, -0.045, -0.12),
    point(width, -0.045, 0.19),
    point(width * 0.65, -0.045, 0.24),
    point(-width * 0.65, -0.045, 0.24),
    point(-width, -0.045, 0.19),
  ];
  scene.poly(
    [
      point(-width, 0.07, -0.12),
      point(width, 0.07, -0.12),
      point(width, 0.07, 0.2),
      point(-width, 0.07, 0.2),
    ],
    "#243d4d",
    "#7b9ba666",
  );
  scene.poly(
    [
      point(-width, 0.07, 0.2),
      point(width, 0.07, 0.2),
      point(width, -0.045, 0.2),
      point(-width, -0.045, 0.2),
    ],
    "#172737",
  );
  scene.poly(
    [
      point(-width, 0.07, -0.12),
      point(width, 0.07, -0.12),
      point(width, -0.045, -0.12),
      point(-width, -0.045, -0.12),
    ],
    "#172737",
    "#6e8b9666",
  );
  if (leg.bootPitch > 0.65) {
    scene.poly(sole, "#111e2b", "#a4d48b");
    for (const z of [-0.065, 0.015, 0.095, 0.175])
      scene.line(
        [point(-width * 0.7, -0.05, z), point(width * 0.7, -0.05, z)],
        "#57717b",
        Math.max(1, shadow.k * 0.022),
      );
  }
  scene.line(
    [point(-width, -0.05, -0.105), point(width, -0.05, -0.105)],
    "#bdff87",
    Math.max(1, shadow.k * 0.025),
    4,
  );
}
