import { NAVIGATION } from "../../config/navigation.js";
import { upcomingCorner } from "./route.js";

export function resetNavigation(game) {
  game.x = 0;
  game.steer = 0;
  game.heading = 0;
  game.turnsCompleted = 0;
  game.turnAnimation = null;
  game.corners = [];
  game.nextCorner =
    game.speed * (NAVIGATION.firstCornerSeconds + game.random() * 6);
}

export function turnWindow(game) {
  const corner = upcomingCorner(game);
  if (!corner) return null;
  const seconds = (corner.position - game.distance) / game.speed;
  return {
    corner,
    seconds,
    open:
      seconds <= NAVIGATION.earlyTurnSeconds &&
      seconds >= -NAVIGATION.lateTurnSeconds,
  };
}

export function requestTurn(game, direction) {
  if (game.status !== "running" || ![-1, 1].includes(direction)) return false;
  const window = turnWindow(game);
  if (!window?.open || window.corner.queued) return false;
  if (direction !== window.corner.direction) {
    game.end("corner");
    return false;
  }
  window.corner.queued = true;
  game.steer = 0;
  return true;
}

export function advanceNavigation(game, dt) {
  game.x = Math.max(
    -NAVIGATION.lateralLimit,
    Math.min(
      NAVIGATION.lateralLimit,
      game.x + game.steer * NAVIGATION.lateralSpeed * dt,
    ),
  );
  if (game.turnAnimation) {
    game.turnAnimation.elapsed += dt;
    if (game.turnAnimation.elapsed >= NAVIGATION.turnDuration)
      game.turnAnimation = null;
  }
  const corner = upcomingCorner(game);
  if (!corner || game.distance < corner.position) return;
  if (corner.queued) {
    corner.turned = true;
    game.heading += (corner.direction * Math.PI) / 2;
    game.turnsCompleted++;
    game.turnAnimation = { direction: corner.direction, elapsed: 0 };
  } else if (
    game.distance >
    corner.position + game.speed * NAVIGATION.lateTurnSeconds
  )
    game.end("corner");
}
