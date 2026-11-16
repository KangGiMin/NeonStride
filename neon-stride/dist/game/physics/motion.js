import { RULES, SIMULATION } from "../../config/rules.js";

export function advanceFall(game, dt) {
  const fallStep = Math.min(dt, RULES.fallDuration - game.fallTime);
  game.y += game.vy * fallStep - (RULES.fallGravity * fallStep * fallStep) / 2;
  game.vy -= RULES.fallGravity * fallStep;
  game.fallTime = Math.min(RULES.fallDuration, game.fallTime + fallStep);
  if (game.fallTime >= RULES.fallDuration - SIMULATION.epsilon) {
    game.fallTime = RULES.fallDuration;
    game.status = "over";
  }
}

export function advanceJump(game, dt) {
  if (game.y > 0 || game.vy > 0) {
    game.y += game.vy * dt - (RULES.gravity * dt * dt) / 2;
    game.vy -= RULES.gravity * dt;
    if (game.y <= 0) {
      game.y = 0;
      game.vy = 0;
      game.jumps = 0;
    }
  }
}
