import { RULES, SIMULATION, SPAWN, COLLISION } from "../config/rules.js";
import { DIFFICULTIES, DEFAULT_DIFFICULTY } from "../config/difficulties.js";
import { isPit } from "./obstacles/catalog.js";
import { generateObstacles } from "./obstacles/generator.js";
import { updateRunner } from "./physics/simulation.js";
import { resetNavigation, requestTurn } from "./navigation/movement.js";
import { generateRoute } from "./navigation/route.js";

export class Runner {
  constructor(random = Math.random) {
    this.random = random;
    this.difficulty = DEFAULT_DIFFICULTY;
    this.reset();
  }

  get config() {
    return DIFFICULTIES[this.difficulty];
  }

  reset() {
    this.status = "ready";
    this.elapsed = 0;
    this.distance = 0;
    this.speed = this.config.initialSpeed;
    this.y = 0;
    this.vy = 0;
    this.jumps = 0;
    this.slideTime = 0;
    this.slideHeld = false;
    this.fallTime = 0;
    this.reason = "";
    this.cleared = 0;
    this.obstacles = [];
    this.sequence = 0;
    this.nextPosition = this.config.initialSpeed * SPAWN.firstDelay;
    this.empStrength = 0;
    resetNavigation(this);
    this.generate();
  }

  get score() {
    return Math.floor(
      (this.elapsed + SIMULATION.scoreEpsilon) * SIMULATION.scoreRate,
    );
  }

  get sliding() {
    return this.y === 0 && (this.slideTime > 0 || this.slideHeld);
  }

  get height() {
    return this.sliding ? RULES.slideHeight : RULES.standingHeight;
  }

  start(difficulty = this.difficulty) {
    if (!Object.hasOwn(DIFFICULTIES, difficulty))
      throw new Error("Unknown difficulty");
    this.difficulty = difficulty;
    this.reset();
    this.status = "running";
  }

  pause() {
    if (this.status === "running") {
      this.status = "paused";
      this.slideHeld = false;
      this.steer = 0;
    }
  }

  resume() {
    if (this.status === "paused") this.status = "running";
  }

  move(direction) {
    if (this.status !== "running") return false;
    this.steer = Math.sign(direction);
    return true;
  }

  turn(direction) {
    return requestTurn(this, direction);
  }

  jump() {
    if (this.status !== "running" || this.jumps >= SIMULATION.maxJumps)
      return false;
    this.slideTime = 0;
    this.slideHeld = false;
    this.vy = this.jumps === 0 ? RULES.jump : RULES.doubleJump;
    this.jumps++;
    return true;
  }

  slide(held = false) {
    if (this.status !== "running") return false;
    // Cancel either jump immediately and enter the grounded slide pose.
    this.y = 0;
    this.vy = 0;
    this.jumps = 0;
    this.slideTime = RULES.slideDuration;
    this.slideHeld = held;
    return true;
  }

  end(reason) {
    this.reason = reason;
    this.slideHeld = false;
    this.slideTime = 0;
    this.steer = 0;
    if (isPit(reason)) {
      this.status = "falling";
      this.fallTime = 0;
      this.vy = Math.min(this.vy, COLLISION.fallVelocity);
    } else this.status = "over";
  }

  generate() {
    generateRoute(this);
    generateObstacles(this);
  }
  update(seconds) {
    updateRunner(this, seconds);
  }
}
