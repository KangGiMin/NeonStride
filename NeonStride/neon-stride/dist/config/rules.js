export const RULES = Object.freeze({
  initialSpeed: 14,
  maxSpeed: 30,
  acceleration: 0.055,
  gravity: 22,
  jump: 7.7,
  doubleJump: 8.8,
  standingHeight: 1.65,
  slideHeight: 0.58,
  slideDuration: 0.9,
  lowHeight: 0.72,
  highHeight: 1.8,
  fallDuration: 0.85,
  fallGravity: 20,
});
export const SIMULATION = Object.freeze({
  step: 1 / 120,
  epsilon: 1e-9,
  scoreEpsilon: 1e-8,
  scoreRate: 10,
  maxJumps: 2,
});
export const SPAWN = Object.freeze({
  firstDelay: 48 / RULES.initialSpeed,
  lookAhead: 310,
  speedEstimateSeconds: 6,
  spacingJitter: 0.55,
  obstacleLength: 1.25,
  doubleTreeLength: 2.2,
  gapSeconds: 0.62,
  collapseSeconds: 0.8,
  retireBehind: 15,
});
export const COLLISION = Object.freeze({
  front: 0.25,
  back: -0.25,
  clearedBehind: -0.3,
  pitHeight: 0.025,
  fallVelocity: -1.2,
});
