import { seeded } from "../shared.js";

export function steelCollapse(scene, o, z, progress) {
  if (progress <= 0) return;
  const impact = 0.62,
    fall = Math.min(1, progress / impact),
    center = z + o.length * 0.3;
  const altitude =
    11 * (1 - fall * fall) - (progress > impact ? (progress - impact) * 16 : 0);
  for (const x of [-0.18, 0.18])
    scene.worldLine(
      [
        { x: -3.1, y: altitude + x, z: center - 0.3 },
        { x: 3.1, y: altitude + x, z: center + 0.3 },
      ],
      "#9cacb8",
      0.16,
    );
  for (let i = 0; i < 7; i++) {
    const x = -3 + i;
    scene.worldLine(
      [
        { x, y: altitude - 0.18, z: center - 0.3 },
        { x: x + 0.5, y: altitude + 0.18, z: center + 0.3 },
        { x: x + 1, y: altitude - 0.18, z: center - 0.3 },
      ],
      "#536d82",
      0.08,
    );
  }
  if (progress > impact) {
    const burst = (progress - impact) / (1 - impact);
    for (let i = 0; i < 12; i++) {
      const x = (seeded(i + o.id) - 0.5) * 6,
        depth = center + (seeded(i + 61) - 0.5) * o.length;
      scene.box(
        x,
        -burst * (1 + seeded(i + 33) * 6),
        depth,
        0.25 + seeded(i) * 0.5,
        0.25,
        0.4,
        ["#477080", "#1e3a4a", "#82a1a7"],
      );
      if (burst < 0.6) {
        const p = scene.project(x, burst * 1.5, depth);
        scene.line(
          [
            { x: p.x, y: p.y },
            { x: p.x + (seeded(i + 77) - 0.5) * 14, y: p.y - 6 },
          ],
          "#ffc981",
          1.3,
          4,
        );
      }
    }
  }
}
