export const RULES = Object.freeze({ initialSpeed: 14, maxSpeed: 30, acceleration: 0.055, gravity: 22, jump: 7.7, doubleJump: 8.8, standingHeight: 1.65, slideHeight: 0.58, slideDuration: 0.9, lowHeight: 0.72, highHeight: 1.8, fallDuration: 0.85, fallGravity: 20 });
export const DIFFICULTIES = Object.freeze({
  easy: Object.freeze({ label: '쉬움', initialSpeed: 14, maxSpeed: 30, acceleration: 0.055, revealDistance: 150, eventLead: 1.8, spacing: 2.35, description: '기존 속도 · 여유롭게 시작하는 질주' }),
  normal: Object.freeze({ label: '보통', initialSpeed: 19, maxSpeed: 38, acceleration: 0.075, revealDistance: 125, eventLead: 1.35, spacing: 2.1, description: '쉬움보다 빠르게 · 리듬을 타는 질주' }),
  hard: Object.freeze({ label: '어려움', initialSpeed: 31, maxSpeed: 53, acceleration: 0.11, revealDistance: 80, eventLead: 0.95, spacing: 1.7, description: '순발력 트레이닝 · 빠른 판단이 필요한 질주' }),
  extreme: Object.freeze({ label: '매우 어려움', initialSpeed: 48, maxSpeed: 76, acceleration: 0.17, revealDistance: 42, eventLead: 0.56, spacing: 1.4, description: '한순간의 반응 · 극한 속도의 질주' }),
});
export const OBSTACLES = Object.freeze({
  low: { kind: 'jump', height: 0.72 }, high: { kind: 'jump', height: 1.8 },
  bar: { kind: 'slide', bottom: 1, top: 2.5 }, gap: { kind: 'gap' },
  monster: { kind: 'slide', bottom: 1, top: 2.5 }, trees: { kind: 'jump', height: 0.84 },
  collapse: { kind: 'gap' }, fire: { kind: 'slide', bottom: 1, top: 2.5 },
});
export const isPit = type => OBSTACLES[type]?.kind === 'gap';
export function obstacleSpec(o) {
  const spec = OBSTACLES[o.type];
  return o.type === 'trees' ? { ...spec, height: o.variant === 2 ? 1.65 : 0.84 } : spec;
}
export function hazardProgress(o, distance, speed, difficulty = 'easy') {
  const lead = DIFFICULTIES[difficulty].eventLead;
  return Math.max(0, Math.min(1, 1 - (o.position - distance) / (speed * lead)));
}
export class Runner {
  constructor(random = Math.random) { this.random = random; this.difficulty = 'easy'; this.reset(); }
  get config() { return DIFFICULTIES[this.difficulty]; }
  reset() {
    this.status = 'ready'; this.elapsed = 0; this.distance = 0; this.speed = this.config.initialSpeed;
    this.y = 0; this.vy = 0; this.jumps = 0; this.slideTime = 0; this.slideHeld = false;
    this.fallTime = 0;
    this.reason = ''; this.cleared = 0; this.obstacles = []; this.sequence = 0;
    this.nextPosition = this.config.initialSpeed * (48 / 14); this.generate();
  }
  get score() { return Math.floor((this.elapsed + 1e-8) * 10); }
  get sliding() { return this.y === 0 && (this.slideTime > 0 || this.slideHeld); }
  get height() { return this.sliding ? RULES.slideHeight : RULES.standingHeight; }
  start(difficulty = this.difficulty) {
    if (!Object.hasOwn(DIFFICULTIES, difficulty)) throw new Error('Unknown difficulty');
    this.difficulty = difficulty; this.reset(); this.status = 'running';
  }
  pause() { if (this.status === 'running') { this.status = 'paused'; this.slideHeld = false; } }
  resume() { if (this.status === 'paused') this.status = 'running'; }
  jump() {
    if (this.status !== 'running' || this.jumps >= 2) return false;
    this.slideTime = 0; this.slideHeld = false; this.vy = this.jumps === 0 ? RULES.jump : RULES.doubleJump; this.jumps++; return true;
  }
  slide(held = false) {
    if (this.status !== 'running') return false;
    // Cancel either jump immediately and enter the grounded slide pose.
    this.y = 0; this.vy = 0; this.jumps = 0;
    this.slideTime = RULES.slideDuration; this.slideHeld = held;
    return true;
  }
  generate() {
    const types = ['low', 'monster', 'trees', 'fire', 'collapse', 'bar', 'high', 'gap'];
    while (this.nextPosition < this.distance + 310) {
      const type = types[Math.floor(this.random() * types.length) % types.length];
      const futureSpeed = Math.min(this.config.maxSpeed, this.speed + this.config.acceleration * 6);
      const variant = type === 'trees' ? (this.random() < 0.5 ? 1 : 2) : 1;
      const length = isPit(type) ? futureSpeed * (type === 'collapse' ? 0.8 : 0.62) : type === 'trees' && variant === 2 ? 2.2 : 1.25;
      this.obstacles.push({ type, position: this.nextPosition, length, variant, passed: false, id: this.sequence++ });
      this.nextPosition += length + futureSpeed * (this.config.spacing + this.random() * 0.55);
    }
  }
  end(reason) {
    this.reason = reason; this.slideHeld = false; this.slideTime = 0;
    if(isPit(reason)){
      this.status = 'falling'; this.fallTime = 0;
      this.vy = Math.min(this.vy, -1.2);
    }else this.status = 'over';
  }
  update(seconds) {
    if (this.status !== 'running' && this.status !== 'falling') return;
    let remaining = Math.max(0, seconds);
    while (remaining > 1e-9 && (this.status === 'running' || this.status === 'falling')) {
      const dt = Math.min(remaining, 1 / 120); remaining -= dt;
      if(this.status === 'falling'){
        const fallStep = Math.min(dt, RULES.fallDuration-this.fallTime);
        this.y += this.vy*fallStep - RULES.fallGravity*fallStep*fallStep/2;
        this.vy -= RULES.fallGravity*fallStep;
        this.fallTime = Math.min(RULES.fallDuration, this.fallTime+fallStep);
        if(this.fallTime >= RULES.fallDuration-1e-9){this.fallTime=RULES.fallDuration;this.status='over';}
        continue;
      }
      this.elapsed += dt; this.speed = Math.min(this.config.maxSpeed, this.config.initialSpeed + this.elapsed * this.config.acceleration);
      this.distance += this.speed * dt; this.slideTime = Math.max(0, this.slideTime - dt);
      if (this.y > 0 || this.vy > 0) {
        this.y += this.vy * dt - RULES.gravity * dt * dt / 2; this.vy -= RULES.gravity * dt;
        if (this.y <= 0) { this.y = 0; this.vy = 0; this.jumps = 0; }
      }
      for (const o of this.obstacles) {
        const z = o.position - this.distance, spec = obstacleSpec(o);
        if (spec.kind === 'gap') {
          if (z <= 0 && z + o.length >= 0 && this.y <= 0.025) { this.end(o.type); break; }
        } else if (z < 0.25 && z + o.length > -0.25) {
          const hit = spec.kind === 'slide' ? this.y < spec.top && this.y + this.height > spec.bottom : this.y < spec.height;
          if (hit) { this.end(o.type); break; }
        }
        if (!o.passed && z + o.length < -0.3) { o.passed = true; this.cleared++; }
      }
      this.obstacles = this.obstacles.filter(o => o.position + o.length > this.distance - 15);
      this.generate();
    }
  }
}
