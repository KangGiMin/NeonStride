import { createStrikes, strikeState } from "../../game/obstacles/dynamic.js";
import { HAZARDS } from "../../config/hazards.js";
import { drawDrone } from "./drone-body.js";

export function airstrike(scene, obstacle, z, progress, time, game) {
  const strikes =
    obstacle.strikes ?? createStrikes(obstacle.position, game.speed);
  for (const [index, strike] of strikes.entries()) {
    const state = strikeState(strike, game),
      d = strike.position - game.distance;
    if (state.seconds < -0.3) continue;
    const droneX = (index - 1) * 1.9,
      droneY = 3.6 + Math.sin(time * 2 + index) * 0.13;
    drawDrone(scene, droneX, droneY, d + 4, "#ff8b8b");
    if (strike.x === null) continue;
    const color = state.firing ? "#fff1dc" : "#ff786e";
    const radius = HAZARDS.strikeRadius;
    scene.quad(
      strike.x - radius,
      strike.x + radius,
      d - 0.7,
      d + 0.7,
      0.035,
      state.firing ? "#ff796ba0" : "#ff594a40",
      color,
    );
    for (const sign of [-1, 1])
      scene.worldLine(
        [
          { x: strike.x - radius, y: 0.05, z: d + sign * 0.65 },
          { x: strike.x + radius, y: 0.05, z: d - sign * 0.65 },
        ],
        color,
        0.035,
        4,
      );
    if (state.firing)
      scene.worldLine(
        [
          { x: droneX, y: droneY, z: d + 4 },
          { x: strike.x, y: 0.04, z: d },
        ],
        "#fff3dd",
        0.16,
        18,
      );
    else if (state.warning)
      scene.worldLine(
        [
          { x: droneX, y: droneY, z: d + 4 },
          { x: strike.x, y: 0.04, z: d },
        ],
        "#ff877b66",
        0.018,
        2,
      );
  }
}
