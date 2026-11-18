import { DIFFICULTIES, DEFAULT_DIFFICULTY } from "../../config/difficulties.js";
import { RULES } from "../../config/rules.js";
import { isPit, hazardProgress } from "../../game/obstacles/catalog.js";
import { CYAN } from "../shared.js";
import { cornerPads } from "./corners.js";

export function road(
  scene,
  distance,
  obstacles,
  speed = RULES.initialSpeed,
  difficulty = DEFAULT_DIFFICULTY,
) {
  const c = scene.ctx;
  cornerPads(scene);
  const gaps = obstacles
    .filter(
      (o) =>
        isPit(o.type) &&
        o.position - distance < DIFFICULTIES[difficulty].revealDistance &&
        (o.type !== "collapse" ||
          hazardProgress(o, distance, speed, difficulty) >= 0.62),
    )
    .map((o) => ({
      a: o.position - distance,
      b: o.position + o.length - distance,
    }));
  // Split exactly at gap edges so the black opening matches the collision zone.
  const points = [-3, 210];
  for (const corner of scene.view?.game.corners ?? []) {
    const z = corner.position - distance;
    if (z > -3 && z < 210) points.push(z);
  }
  for (let i = 0; i < 75; i++) {
    const z = i * 3 - (((distance % 3) + 3) % 3);
    if (z > -3 && z < 210) points.push(z);
  }
  for (const g of gaps) {
    if (g.a > -3 && g.a < 210) points.push(g.a);
    if (g.b > -3 && g.b < 210) points.push(g.b);
  }
  points.sort((a, b) => b - a);
  for (let i = 0; i < points.length - 1; i++) {
    const far = points[i],
      near = points[i + 1],
      mid = (near + far) / 2;
    if (gaps.some((g) => mid > g.a && mid < g.b)) {
      scene.quad(-3.15, 3.15, near, far, -0.5, "#01060d");
      if (gaps.some((g) => Math.abs(near - g.a) < 0.01))
        scene.line(
          [scene.project(-3.15, 0, near), scene.project(3.15, 0, near)],
          "#ff675d",
          2,
          8,
        );
      if (gaps.some((g) => Math.abs(far - g.b) < 0.01))
        scene.line(
          [scene.project(-3.15, 0, far), scene.project(3.15, 0, far)],
          "#ff675d",
          2,
          8,
        );
      continue;
    }
    scene.quad(
      -3.15,
      3.15,
      near,
      far,
      0,
      Math.floor((mid + distance) / 3) % 2 ? "#122331" : "#142735",
    );
    scene.quad(-3.55, -3.15, near, far, -0.09, "#203b4a");
    scene.quad(3.15, 3.55, near, far, -0.09, "#203b4a");
    scene.line(
      [scene.project(-3.12, 0.01, near), scene.project(-3.12, 0.01, far)],
      "#64f4e3",
      1.4,
      5,
    );
    scene.line(
      [scene.project(3.12, 0.01, near), scene.project(3.12, 0.01, far)],
      "#64f4e3",
      1.4,
      5,
    );
    scene.line(
      [scene.project(-3.56, -0.04, near), scene.project(-3.56, -0.04, far)],
      "#4785aa88",
      1,
    );
    scene.line(
      [scene.project(3.56, -0.04, near), scene.project(3.56, -0.04, far)],
      "#4785aa88",
      1,
    );
    scene.line(
      [scene.project(-3, 0, near), scene.project(3, 0, near)],
      "#416c7c26",
      0.7,
    );
    for (const x of [-1.05, 1.05])
      scene.line(
        [scene.project(x, 0.015, near), scene.project(x, 0.015, far)],
        "#5294a52a",
        0.8,
      );
    if (Math.floor((mid + distance) / 3) % 4 === 0)
      for (const x of [-2.85, 2.85])
        scene.quad(x - 0.025, x + 0.025, near, far, 0.025, "#7eeaff99");
  }
  // Floating guard-light pylons at both sides.
  for (let i = 24; i >= 0; i--) {
    const z = i * 9 - (((distance % 9) + 9) % 9);
    if (z < -2) continue;
    for (const side of [-1, 1]) {
      const x = side * 3.43;
      scene.box(x, 0, z, 0.09, 0.8, 0.13, ["#244253", "#15293a", "#3c6978"]);
      scene.line(
        [scene.project(x, 0.5, z), scene.project(x, 0.83, z)],
        CYAN,
        Math.max(1, scene.project(x, 0, z).k * 0.035),
        5,
      );
    }
  }
  // Roadway direction chevrons, travelling towards the runner.
  for (let i = 0; i < 10; i++) {
    const z = i * 20 - (((distance % 20) + 20) % 20);
    if (z < 2) continue;
    scene.line(
      [
        scene.project(-0.28, 0.02, z + 1),
        scene.project(0, 0.02, z),
        scene.project(0.28, 0.02, z + 1),
      ],
      "#80b5bd50",
      1,
    );
  }
  const haze = c.createLinearGradient(0, scene.h * 0.36, 0, scene.h * 0.5);
  haze.addColorStop(0, "#73b2b633");
  haze.addColorStop(1, "#64a5b000");
  c.fillStyle = haze;
  c.fillRect(scene.w * 0.42, scene.h * 0.36, scene.w * 0.16, scene.h * 0.14);
}
