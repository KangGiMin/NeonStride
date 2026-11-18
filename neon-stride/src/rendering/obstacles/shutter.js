import { shutterOpening } from "../../game/obstacles/dynamic.js";

export function shutter(scene, obstacle, z, progress, time, game) {
  const opening = shutterOpening(obstacle, game.distance, game.speed);
  const color = obstacle.variant === 2 ? "#76edca" : "#ffb76b";
  for (const x of [-3.4, 3.4])
    scene.box(x, 0, z, 0.4, 4.4, 0.8, ["#536474", "#1e2c3b", "#8fa3b2"], color);
  scene.box(
    0,
    opening.top,
    z,
    6.4,
    Math.max(0.1, 4.4 - opening.top),
    0.65,
    ["#536476", "#202e40", "#99aab6"],
    color,
  );
  if (opening.bottom > 0.01)
    scene.box(
      0,
      0,
      z,
      6.4,
      opening.bottom,
      0.65,
      ["#536476", "#202e40", "#99aab6"],
      color,
    );
  scene.worldLine(
    [
      { x: -3.15, y: opening.top, z: z - 0.02 },
      { x: 3.15, y: opening.top, z: z - 0.02 },
    ],
    color,
    0.055,
    5,
  );
  scene.worldLine(
    [
      { x: -3.15, y: opening.bottom + 0.02, z: z - 0.02 },
      { x: 3.15, y: opening.bottom + 0.02, z: z - 0.02 },
    ],
    color,
    0.055,
    5,
  );
  for (const x of [-2.7, -1.8, -0.9, 0, 0.9, 1.8, 2.7])
    scene.worldLine(
      [
        { x: x - 0.12, y: opening.top + 0.08, z: z - 0.03 },
        { x: x + 0.12, y: opening.top + 0.28, z: z - 0.03 },
      ],
      "#dfe5ae",
      0.045,
    );
}
