import { NAVIGATION } from "../../config/navigation.js";
import { SPAWN } from "../../config/rules.js";
import { HAZARDS } from "../../config/hazards.js";

export function makeCorner(previous, position, direction) {
  const heading = previous?.heading ?? 0;
  const length = position - (previous?.position ?? 0);
  return {
    position,
    direction,
    turned: false,
    queued: false,
    worldX: (previous?.worldX ?? 0) + Math.sin(heading) * length,
    worldZ: (previous?.worldZ ?? 0) + Math.cos(heading) * length,
    heading: heading + (direction * Math.PI) / 2,
  };
}

export function routeFrame(corners, distance) {
  let low = 0,
    high = corners.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (corners[middle].position <= distance) low = middle + 1;
    else high = middle;
  }
  const corner = corners[low - 1],
    heading = corner?.heading ?? 0;
  const length = distance - (corner?.position ?? 0);
  return {
    x: (corner?.worldX ?? 0) + Math.sin(heading) * length,
    z: (corner?.worldZ ?? 0) + Math.cos(heading) * length,
    heading,
  };
}

export function generateRoute(game) {
  const reserve =
    game.config.maxSpeed * (NAVIGATION.clearBeforeSeconds + HAZARDS.empSeconds);
  while (game.nextCorner < game.distance + SPAWN.lookAhead + reserve) {
    const corner = makeCorner(
      game.corners.at(-1),
      game.nextCorner,
      game.random() < 0.5 ? -1 : 1,
    );
    const expectedSpeed =
      Math.min(
        game.config.maxSpeed,
        Math.sqrt(
          game.speed ** 2 +
            2 *
              game.config.acceleration *
              Math.max(0, corner.position - game.distance),
        ),
      ) + 0.05;
    corner.clearBefore =
      corner.position - expectedSpeed * NAVIGATION.clearBeforeSeconds;
    corner.clearAfter =
      corner.position + expectedSpeed * NAVIGATION.clearAfterSeconds;
    game.corners.push(corner);
    game.nextCorner +=
      game.speed *
      (NAVIGATION.cornerIntervalMin +
        game.random() * NAVIGATION.cornerIntervalRange);
  }
  while (
    game.corners.length > 2 &&
    game.corners[1].position < game.distance - SPAWN.lookAhead
  )
    game.corners.shift();
}

export function nearCorner(game, start, end) {
  return game.corners.some(
    (c) =>
      end >
        (c.clearBefore ??
          c.position - game.speed * NAVIGATION.clearBeforeSeconds) &&
      start <
        (c.clearAfter ??
          c.position + game.speed * NAVIGATION.clearAfterSeconds),
  );
}

export function upcomingCorner(game) {
  return game.corners.find((corner) => !corner.turned);
}
