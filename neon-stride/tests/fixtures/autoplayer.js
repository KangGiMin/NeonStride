import { isPit, obstacleSpec } from "../../src/engine.js";
import { turnWindow } from "../../src/game/navigation/movement.js";
import { patrolX, strikeState } from "../../src/game/obstacles/dynamic.js";

export function createAutoplayer() {
  let doubleAt = null;
  const seen = new Set();
  function play(game) {
    const corner = turnWindow(game);
    if (corner?.open && corner.seconds < 0.4 && !corner.corner.queued)
      game.turn(corner.corner.direction);
    const next = game.obstacles.find(
      (o) => !o.passed && o.position + o.length > game.distance - 0.25,
    );
    game.move(0);
    if (next) {
      const seconds = (next.position - game.distance) / game.speed,
        spec = obstacleSpec(next);
      if (seconds < 2.6) seen.add(next.type);
      if (spec.kind === "moving" && seconds < 1.3) {
        const x = patrolX(next, game.elapsed + Math.max(0, seconds));
        if (Math.abs(game.x - x) < 1.2) game.move(x > 0 ? -1 : 1);
      } else if (spec.kind === "targeted") {
        const strike = next.strikes.find(
          (s) => s.x !== null && strikeState(s, game).seconds >= -0.13,
        );
        if (strike && Math.abs(game.x - strike.x) < 1.2)
          game.move(strike.x > 0 ? -1 : 1);
      } else if (seconds > 0) {
        const opening = spec.kind === "shutter" && next.variant === 2;
        const needsDouble = isPit(next.type) || spec.height > 1.35;
        const lead =
          next.type === "collapse"
            ? 0.23
            : spec.height > 1.35
              ? 0.46
              : opening
                ? 0.36
                : 0.29;
        if (seconds < lead && game.jumps === 0) {
          if (spec.kind === "slide" || (spec.kind === "shutter" && !opening))
            game.slide();
          else if (["jump", "gap", "shutter"].includes(spec.kind)) {
            game.jump();
            doubleAt = needsDouble ? game.elapsed + 0.19 : null;
          }
        }
      }
    }
    if (doubleAt !== null && game.elapsed >= doubleAt) {
      game.jump();
      doubleAt = null;
    }
  }
  return { play, seen };
}
