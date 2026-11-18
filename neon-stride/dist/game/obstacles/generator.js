import { SPAWN } from "../../config/rules.js";
import { OBSTACLE_SEQUENCE, isPit } from "./catalog.js";
import { nearCorner } from "../navigation/route.js";
import { HAZARDS } from "../../config/hazards.js";
import { createStrikes } from "./dynamic.js";

export function generateObstacles(game) {
  const types = OBSTACLE_SEQUENCE;
  while (game.nextPosition < game.distance + SPAWN.lookAhead) {
    const type = types[Math.floor(game.random() * types.length) % types.length];
    const futureSpeed = Math.min(
      game.config.maxSpeed,
      game.speed + game.config.acceleration * SPAWN.speedEstimateSeconds,
    );
    const variant = ["trees", "shutter", "patrol"].includes(type)
      ? game.random() < 0.5
        ? 1
        : 2
      : 1;
    const length =
      type === "emp"
        ? futureSpeed * HAZARDS.empSeconds
        : type === "airstrike"
          ? futureSpeed * (2 * HAZARDS.strikeSpacing + HAZARDS.strikeDuration)
          : isPit(type)
            ? futureSpeed *
              (type === "collapse" ? SPAWN.collapseSeconds : SPAWN.gapSeconds)
            : type === "trees" && variant === 2
              ? SPAWN.doubleTreeLength
              : SPAWN.obstacleLength;
    const obstacle = {
      type,
      position: game.nextPosition,
      length,
      variant,
      passed: false,
      id: game.sequence++,
    };
    if (type === "patrol")
      obstacle.phase = game.random() * HAZARDS.patrolRange * 4;
    if (type === "airstrike")
      obstacle.strikes = createStrikes(game.nextPosition, futureSpeed);
    if (!nearCorner(game, obstacle.position, obstacle.position + length))
      game.obstacles.push(obstacle);
    game.nextPosition +=
      length +
      futureSpeed * (game.config.spacing + game.random() * SPAWN.spacingJitter);
  }
}
