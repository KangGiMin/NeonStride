import { patrolX } from "../../game/obstacles/dynamic.js";
import { drawDrone } from "./drone-body.js";

export function patrol(scene, obstacle, z, progress, time, game) {
  const x = patrolX(obstacle, game.elapsed),
    hover = obstacle.variant === 2;
  const y = hover ? 0.55 : 1.6;
  scene.worldLine(
    [
      { x: -2.4, y: 0.03, z },
      { x: 2.4, y: 0.03, z },
    ],
    "#ff9a5744",
    0.035,
  );
  scene.poly(
    [
      scene.project(x - 0.62, 0.02, z - 0.2),
      scene.project(x + 0.62, 0.02, z - 0.2),
      scene.project(x + 0.62, 2.8, z + 0.45),
      scene.project(x - 0.62, 2.8, z + 0.45),
    ],
    "#ff64591d",
    "#ff8d7455",
  );
  drawDrone(scene, x, y + Math.sin(time * 4) * 0.06, z, "#ff9868", hover);
}
