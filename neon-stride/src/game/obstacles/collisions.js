import { COLLISION } from "../../config/rules.js";
import { obstacleSpec } from "./catalog.js";
import { NAVIGATION } from "../../config/navigation.js";
import { HAZARDS } from "../../config/hazards.js";
import { patrolX, shutterOpening, strikeState } from "./dynamic.js";

export function checkCollisions(game) {
  for (const o of game.obstacles) {
    const z = o.position - game.distance,
      spec = obstacleSpec(o);
    if (spec.kind === "targeted") {
      if (
        o.strikes?.some(
          (strike) =>
            strike.x !== null &&
            strikeState(strike, game).firing &&
            Math.abs(game.x - strike.x) <
              HAZARDS.strikeRadius + NAVIGATION.runnerRadius,
        )
      ) {
        game.end(o.type);
        break;
      }
    } else if (spec.kind === "effect") {
      // EMP affects visibility only; it never ends a run.
    } else if (spec.kind === "gap") {
      if (z <= 0 && z + o.length >= 0 && game.y <= COLLISION.pitHeight) {
        game.end(o.type);
        break;
      }
    } else if (z < COLLISION.front && z + o.length > COLLISION.back) {
      let hit;
      if (spec.kind === "moving")
        hit =
          Math.abs(game.x - patrolX(o, game.elapsed)) <
          HAZARDS.patrolRadius + NAVIGATION.runnerRadius;
      else if (spec.kind === "shutter") {
        const opening = shutterOpening(o, game.distance, game.speed);
        hit = game.y < opening.bottom || game.y + game.height > opening.top;
      } else
        hit =
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
