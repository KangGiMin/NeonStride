import { HAZARDS } from "../../config/hazards.js";

export function energyBeam(scene, obstacle, z, progress, time) {
  for (const side of [-1, 1]) {
    scene.box(
      side * 3.3,
      0,
      z,
      0.35,
      2.15,
      0.65,
      ["#304258", "#111d32", "#9ec5d2"],
      "#c083ff",
    );
  }
  const top = HAZARDS.energyHeight;
  scene.poly(
    [
      scene.project(-3.1, 0.03, z),
      scene.project(3.1, 0.03, z),
      scene.project(3.1, top, z),
      scene.project(-3.1, top, z),
    ],
    "#cd62ff45",
    "#df91ff",
    8,
  );
  for (let i = 0; i < 5; i++) {
    const y = 0.1 + ((top - 0.15) * i) / 4;
    scene.worldLine(
      [
        { x: -3.15, y, z },
        { x: 3.15, y: y + Math.sin(time * 20 + i) * 0.03, z },
      ],
      i === 2 ? "#fff6ff" : "#d986ff",
      i === 2 ? 0.12 : 0.055,
      12,
    );
  }
}
