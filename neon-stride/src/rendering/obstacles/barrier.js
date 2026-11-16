import { OBSTACLES } from "../../game/obstacles/catalog.js";

export function barrier(scene, o, z) {
  const high = o.type === "high",
    height = OBSTACLES[o.type].height;
  scene.box(
    0,
    0,
    z,
    5.55,
    height,
    o.length,
    high
      ? ["#704f2c", "#352d2c", "#9e7444"]
      : ["#24505a", "#173a48", "#387384"],
    high ? "#f8be7b99" : "#69e4ee88",
  );
  const color = high ? "#ffc17b" : "#81f4f0";
  scene.line(
    [
      scene.project(-2.76, height, z - 0.01),
      scene.project(2.76, height, z - 0.01),
    ],
    color,
    2,
    10,
  );
  for (let x = -2.7; x < 2.5; x += 0.5) {
    const p = (a, b) => scene.project(a, b, z - 0.015);
    scene.poly(
      [
        p(x, 0.05),
        p(x + 0.15, 0.05),
        p(x + 0.15 + height * 0.5, height - 0.05),
        p(x + height * 0.5, height - 0.05),
      ],
      high ? "#d6a25d66" : "#83d8dc33",
    );
  }
  scene.box(0, height * 0.22, z - 0.04, 0.56, height * 0.56, 0.035, [
    "#101f2b",
    "#152b36",
    "#244453",
  ]);
}
