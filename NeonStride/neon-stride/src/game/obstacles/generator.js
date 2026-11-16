import { SPAWN } from "../../config/rules.js";
import { OBSTACLE_SEQUENCE, isPit } from "./catalog.js";

export function generateObstacles(game) {
  const types = OBSTACLE_SEQUENCE;
  while (game.nextPosition < game.distance + SPAWN.lookAhead) {
    const type = types[Math.floor(game.random() * types.length) % types.length];
    const futureSpeed = Math.min(
      game.config.maxSpeed,
      game.speed + game.config.acceleration * SPAWN.speedEstimateSeconds,
    );
    const variant = type === "trees" ? (game.random() < 0.5 ? 1 : 2) : 1;
    const length = isPit(type)
      ? futureSpeed *
        (type === "collapse" ? SPAWN.collapseSeconds : SPAWN.gapSeconds)
      : type === "trees" && variant === 2
        ? SPAWN.doubleTreeLength
        : SPAWN.obstacleLength;
    game.obstacles.push({
      type,
      position: game.nextPosition,
      length,
      variant,
      passed: false,
      id: game.sequence++,
    });
    game.nextPosition +=
      length +
      futureSpeed * (game.config.spacing + game.random() * SPAWN.spacingJitter);
  }
}
