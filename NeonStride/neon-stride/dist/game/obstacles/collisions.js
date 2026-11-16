import { COLLISION } from "../../config/rules.js";
import { obstacleSpec } from "./catalog.js";

export function checkCollisions(game) {
  for (const o of game.obstacles) {
    const z = o.position - game.distance,
      spec = obstacleSpec(o);
    if (spec.kind === "gap") {
      if (z <= 0 && z + o.length >= 0 && game.y <= COLLISION.pitHeight) {
        game.end(o.type);
        break;
      }
    } else if (z < COLLISION.front && z + o.length > COLLISION.back) {
      const hit =
        spec.kind === "slide"
          ? game.y < spec.top && game.y + game.height > spec.bottom
          : game.y < spec.height;
      if (hit) {
        game.end(o.type);
        break;
      }
    }
    if (!o.passed && z + o.length < COLLISION.clearedBehind) {
      o.passed = true;
      game.cleared++;
    }
  }
}
