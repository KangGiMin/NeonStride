import { SIMULATION, SPAWN } from "../../config/rules.js";
import { advanceFall, advanceJump } from "./motion.js";
import { checkCollisions } from "../obstacles/collisions.js";

export function updateRunner(game, seconds) {
  if (!["running", "falling"].includes(game.status)) return;
  let remaining = Math.max(0, seconds);
  while (
    remaining > SIMULATION.epsilon &&
    ["running", "falling"].includes(game.status)
  ) {
    const dt = Math.min(remaining, SIMULATION.step);
    remaining -= dt;
    if (game.status === "falling") {
      advanceFall(game, dt);
      continue;
    }
    game.elapsed += dt;
    game.speed = Math.min(
      game.config.maxSpeed,
      game.config.initialSpeed + game.elapsed * game.config.acceleration,
    );
    game.distance += game.speed * dt;
    game.slideTime = Math.max(0, game.slideTime - dt);

    advanceJump(game, dt);
    checkCollisions(game);
    game.obstacles = game.obstacles.filter(
      (o) => o.position + o.length > game.distance - SPAWN.retireBehind,
    );
    game.generate();
  }
}
