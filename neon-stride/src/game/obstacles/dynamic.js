import { HAZARDS } from "../../config/hazards.js";

const clamp = (value) => Math.max(0, Math.min(1, value));

export function patrolX(obstacle, elapsed) {
  const range = HAZARDS.patrolRange;
  const phase =
    (((elapsed * HAZARDS.patrolSpeed + (obstacle.phase ?? 0)) % (4 * range)) +
      4 * range) %
    (4 * range);
  return phase < 2 * range ? -range + phase : 3 * range - phase;
}

export function shutterOpening(obstacle, distance, speed) {
  const progress = clamp(1 - (obstacle.position - distance) / (speed * 1.2));
  const after = clamp(
    (distance - obstacle.position - obstacle.length - 0.3) / (speed * 0.5),
  );
  return obstacle.variant === 2
    ? {
        bottom: (1.8 - progress * 0.98) * (1 - after),
        top: 2 + progress * 1.8 + after,
        mode: "opening",
      }
    : {
        bottom: after * 0.9,
        top: 3.7 - progress * 2.85 - after * 0.65,
        mode: "closing",
      };
}

export function createStrikes(position, speed) {
  return Array.from({ length: HAZARDS.strikeCount }, (_, index) => ({
    position: position + index * speed * HAZARDS.strikeSpacing,
    x: null,
  }));
}

export function strikeState(strike, game) {
  const seconds = (strike.position - game.distance) / game.speed;
  return {
    seconds,
    warning: seconds <= HAZARDS.strikeWarning && seconds > 0,
    firing: seconds <= 0 && seconds >= -HAZARDS.strikeDuration,
  };
}

export function updateHazards(game) {
  game.empStrength = 0;
  for (const obstacle of game.obstacles) {
    if (obstacle.type === "emp") {
      const entered = game.distance - obstacle.position;
      if (entered >= 0 && entered <= obstacle.length)
        game.empStrength = Math.min(
          1,
          entered / (game.speed * 0.2),
          (obstacle.length - entered) / (game.speed * 0.2),
        );
    }
    if (obstacle.type === "airstrike") {
      obstacle.strikes ??= createStrikes(obstacle.position, game.speed);
      for (const strike of obstacle.strikes) {
        const state = strikeState(strike, game);
        if (strike.x === null && (state.warning || state.firing))
          strike.x = game.x;
      }
    }
  }
}
