import { DIFFICULTIES, RULES, hazardProgress, isPit } from './engine.js';
const CYAN = "#55e5ee";
const seeded = (n) => {
  const a = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return a - Math.floor(a);
};
// One complete stride: ground contact, toe-off, heel recovery and landing.
// Each key includes a tangent, keeping position and velocity continuous.
const STRIDE_KEYS = [
  { t: 0, y: .055, z: .30, pitch: -.13, dy: 0, dz: -1.5, dp: 1.3 },
  { t: .38, y: .055, z: -.34, pitch: .60, dy: 0, dz: -1.6, dp: 2.0 },
  { t: .52, y: .42, z: -.44, pitch: .95, dy: 1.2, dz: .1, dp: 0 },
  { t: .70, y: .50, z: -.06, pitch: .4, dy: -.3, dz: 2.5, dp: -3 },
  { t: .88, y: .25, z: .32, pitch: -.20, dy: -2.5, dz: .8, dp: 0 },
  { t: 1, y: .055, z: .30, pitch: -.13, dy: 0, dz: -1.5, dp: 1.3 },
];
function sampleStride(cycle) {
  const index = STRIDE_KEYS.findIndex((key, i) => i > 0 && cycle <= key.t);
  const a = STRIDE_KEYS[index - 1], b = STRIDE_KEYS[index];
  const duration = b.t - a.t, u = (cycle - a.t) / duration;
  const h00 = 2*u**3 - 3*u**2 + 1, h10 = u**3 - 2*u**2 + u;
  const h01 = -2*u**3 + 3*u**2, h11 = u**3 - u**2;
  const interpolate = (value, tangent) => h00*a[value] + h10*duration*a[tangent] + h01*b[value] + h11*duration*b[tangent];
  return { y: interpolate('y','dy'), z: interpolate('z','dz'), pitch: interpolate('pitch','dp') };
}
export function runnerPhase(distance, time) { return distance * .045 + time * 10.8; }
export function runnerPose(phase, airborne = false) {
  const air = Math.max(0, Math.min(1, Number(airborne)));
  const mix = (ground, jump) => ground + (jump-ground)*air;
  const bob = mix(.012 + .035 * (1 + Math.cos(phase*2 + .55)) / 2, 0);
  const sway = mix(Math.sin(phase) * .012, 0);
  const pelvisYaw = mix(Math.cos(phase) * .04, 0);
  const pelvisHeight = .88 + bob;
  const legs = [-1, 1].map(side => {
    const angle = phase + (side === 1 ? Math.PI : 0);
    const cycle = ((angle / (Math.PI*2)) % 1 + 1) % 1;
    const stride = sampleStride(cycle);
    const bootPitch = mix(stride.pitch, .25);
    // Heel and toe rolls keep the supporting sole above the road.
    const soleClearance = .01 + .045*Math.cos(bootPitch) + Math.max(.24*Math.sin(bootPitch), -.12*Math.sin(bootPitch));
    const lift = mix(Math.max(0, Math.min(1, (stride.y - .055) / .45)), .3);
    const hip = { x: side*.15*Math.cos(pelvisYaw) + sway, y: pelvisHeight, z: -side*.15*Math.sin(pelvisYaw) };
    const foot = {
      x: side * (.17 - lift * .012),
      y: mix(Math.max(stride.y, soleClearance), side === -1 ? .34 : .22),
      z: mix(stride.z, side * .24),
    };
    const dx = foot.x-hip.x, dy = foot.y-hip.y, dz = foot.z-hip.z;
    const length = Math.hypot(dx,dy,dz);
    const distance = Math.max(0.001, Math.min(length, 0.949));
    const along = (0.49 ** 2 - 0.46 ** 2 + distance ** 2) / (2 * distance);
    const bend = Math.sqrt(Math.max(0, 0.49 ** 2 - along ** 2));
    const axis = { x: dx/length, y: dy/length, z: dz/length };
    const forward = { x: -axis.x*axis.z, y: -axis.y*axis.z, z: 1-axis.z**2 };
    const forwardLength = Math.hypot(forward.x,forward.y,forward.z);
    const knee = {
      x: hip.x + axis.x*along + forward.x/forwardLength*bend,
      y: hip.y + axis.y*along + forward.y/forwardLength*bend,
      z: hip.z + axis.z*along + forward.z/forwardLength*bend,
    };
    return { side, hip, knee, foot, lift, bootPitch, contact: air < .01 && cycle <= .38, armSwing: mix(-.65*Math.cos(angle-.3), side*.25), angle };
  });
  const arms = legs.map(({ side, armSwing, angle }) => {
    const direction = { x: side*.16, y: -Math.cos(armSwing), z: Math.sin(armSwing) };
    const norm = Math.hypot(direction.x, direction.y, direction.z);
    const upper = { x: direction.x / norm, y: direction.y / norm, z: direction.z / norm };
    const shoulder = { x: side*.29, y: 1.36, z: 0 };
    const elbow = {
      x: shoulder.x + upper.x*.30,
      y: shoulder.y + upper.y*.30,
      z: shoulder.z + upper.z*.30,
    };
    const normal = { x: 0, y: Math.sin(armSwing), z: Math.cos(armSwing) };
    const flex = mix(88 + 8*Math.sin(angle+.25), 88) * Math.PI/180;
    const bendAngle = Math.PI-flex;
    const hand = {
      x: elbow.x + .28*(upper.x*Math.cos(bendAngle) + normal.x*Math.sin(bendAngle)),
      y: elbow.y + .28*(upper.y*Math.cos(bendAngle) + normal.y*Math.sin(bendAngle)),
      z: elbow.z + .28*(upper.z*Math.cos(bendAngle) + normal.z*Math.sin(bendAngle)),
    };
    return { side, shoulder, elbow, hand };
  });
  return { bob, sway, pelvisHeight, lean: mix(8+.5*Math.sin(phase*2),8)*Math.PI/180, roll: mix(Math.sin(phase+.3)*.018,0), twist: mix(-Math.cos(phase)*.06,0), legs, arms };
}
// Rotate the whole upper body rigidly, preserving the arm bend as it leans.
export function runnerBodyPoint(pose, point) {
  const y = point.y - .93, cos = Math.cos(pose.lean), sin = Math.sin(pose.lean);
  const leanedY = y * cos - point.z * sin, leanedZ = y * sin + point.z * cos;
  const turnedX = point.x * Math.cos(pose.twist) + leanedZ * Math.sin(pose.twist);
  const turnedZ = -point.x * Math.sin(pose.twist) + leanedZ * Math.cos(pose.twist);
  return {
    x: turnedX * Math.cos(pose.roll) - leanedY * Math.sin(pose.roll) + pose.sway,
    y: pose.pelvisHeight + turnedX * Math.sin(pose.roll) + leanedY * Math.cos(pose.roll),
    z: turnedZ,
  };
}
export function runnerFallPose(phase, time) {
  const reach = Math.min(1, Math.max(0,time)/.25);
  const pose = runnerPose(phase, Math.min(1, Math.max(0,time)/.12));
  pose.lean += reach*.25;
  pose.roll += Math.sin(time*7)*.08*reach;
  pose.twist += Math.sin(time*4)*.08*reach;
  pose.arms = pose.arms.map(arm => {
    const angle = arm.side*(.95+Math.sin(time*9)*.1)*reach;
    const rotate = point => {
      const x=point.x-arm.shoulder.x,y=point.y-arm.shoulder.y;
      return {x:arm.shoulder.x+x*Math.cos(angle)-y*Math.sin(angle),y:arm.shoulder.y+x*Math.sin(angle)+y*Math.cos(angle),z:point.z};
    };
    return {...arm,elbow:rotate(arm.elbow),hand:rotate(arm.hand)};
  });
  pose.legs = pose.legs.map(leg => {
    const angle = Math.sin(time*6+leg.side)*.16*reach;
    const rotate = point => {
      const y=point.y-leg.hip.y,z=point.z-leg.hip.z;
      return {x:point.x,y:leg.hip.y+y*Math.cos(angle)-z*Math.sin(angle),z:leg.hip.z+y*Math.sin(angle)+z*Math.cos(angle)};
    };
    return {...leg,knee:rotate(leg.knee),foot:rotate(leg.foot),bootPitch:leg.bootPitch+angle};
  });
  return pose;
}
export class Scene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.w = 0;
    this.h = 0;
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.w = rect.width;
    this.h = rect.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  project(x, y, z) {
    const f = this.h * 0.94,
      k = f / Math.max(0.3, z + 7);
    return { x: this.w / 2 + x * k, y: this.h * 0.36 + (3.6 - y) * k, k };
  }
  poly(points, fill, stroke, glow = 0) {
    const c = this.ctx;
    c.beginPath();
    points.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    c.closePath();
    c.fillStyle = fill;
    if (fill) c.fill();
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = 1;
      c.shadowBlur = glow;
      c.shadowColor = stroke;
      c.stroke();
      c.shadowBlur = 0;
    }
  }
  line(points, color, width = 1, glow = 0) {
    const c = this.ctx;
    c.beginPath();
    points.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineJoin = "round";
    c.lineCap = "round";
    c.shadowColor = color;
    c.shadowBlur = glow;
    c.stroke();
    c.shadowBlur = 0;
  }
  quad(x1, x2, z1, z2, y, color, stroke) {
    this.poly(
      [
        this.project(x1, y, z1),
        this.project(x2, y, z1),
        this.project(x2, y, z2),
        this.project(x1, y, z2),
      ],
      color,
      stroke,
    );
  }
  box(x, y, z, width, height, depth, colors, edge, projectPoint) {
    const p = projectPoint || ((a, b, d) => this.project(a, b, d));
    const l = x - width / 2,
      r = x + width / 2,
      t = y + height,
      back = z + depth;
    this.poly(
      [p(l, y, z), p(l, y, back), p(l, t, back), p(l, t, z)],
      colors[1],
      edge,
    );
    this.poly(
      [p(r, y, z), p(r, y, back), p(r, t, back), p(r, t, z)],
      colors[1],
      edge,
    );
    this.poly(
      [p(l, t, z), p(r, t, z), p(r, t, back), p(l, t, back)],
      colors[2],
      edge,
    );
    this.poly(
      [p(l, y, z), p(r, y, z), p(r, t, z), p(l, t, z)],
      colors[0],
      edge,
    );
  }
  sky(time) {
    const c = this.ctx,
      w = this.w,
      h = this.h;
    const bg = c.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#040b19");
    bg.addColorStop(0.45, "#102333");
    bg.addColorStop(1, "#05111d");
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);
    const halo = c.createRadialGradient(
      w * 0.51,
      h * 0.39,
      0,
      w * 0.51,
      h * 0.39,
      w * 0.5,
    );
    halo.addColorStop(0, "#32717b33");
    halo.addColorStop(0.65, "#12354a15");
    halo.addColorStop(1, "#07132200");
    c.fillStyle = halo;
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 75; i++) {
      const x = seeded(i + 3) * w,
        y = seeded(i + 100) * h * 0.47;
      c.globalAlpha = 0.2 + seeded(i + 70) * 0.45;
      c.fillStyle = "#bde3ed";
      c.fillRect(x, y, seeded(i + 60) > 0.9 ? 1.5 : 0.8, 0.8);
    }
    c.globalAlpha = 1;
    // A quiet orbital eclipse above the city.
    const mx = w * 0.72,
      my = h * 0.19,
      mr = h * 0.09;
    const moon = c.createRadialGradient(mx, my, 0, mx, my, mr * 1.3);
    moon.addColorStop(0.65, "#557e8820");
    moon.addColorStop(0.78, "#8eb9b73b");
    moon.addColorStop(0.8, "#9ad9d033");
    moon.addColorStop(1, "#5fb3ad00");
    c.fillStyle = moon;
    c.beginPath();
    c.arc(mx, my, mr * 1.3, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#091322";
    c.beginPath();
    c.arc(mx - mr * 0.2, my - mr * 0.1, mr * 0.76, 0, Math.PI * 2);
    c.fill();
    for (let i = 0; i < 3; i++) {
      const y = h * (0.17 + i * 0.045),
        x = ((time * (i + 1) * 5 + i * w * 0.37) % (w + 200)) - 100;
      this.line(
        [
          { x, y },
          { x: x + 20, y },
        ],
        i % 2 ? "#a9eddb77" : "#77d6f899",
        1,
      );
      c.fillStyle = "#b4ff79";
      c.fillRect(x + 20, y - 1, 2, 2);
    }
    // Layered skyline, with deterministic architectural details.
    for (let layer = 0; layer < 3; layer++)
      for (let i = 0; i < 32; i++) {
        const bw = w / (23 - layer * 3),
          x = i * bw * 0.8 - 35 + layer * 17,
          bh = h * (0.07 + seeded(i + layer * 41) * (0.16 + layer * 0.04));
        const base = h * (0.44 + layer * 0.055);
        c.fillStyle = ["#102334", "#0b1c2b", "#0b1828"][layer];
        c.fillRect(x, base - bh, bw * 0.7, bh);
        c.fillStyle = layer === 2 ? "#2a63716b" : "#2a536151";
        c.fillRect(x, base - bh, 1, bh);
        if (seeded(i * 2 + layer) > 0.6) {
          this.line(
            [
              { x: x + bw * 0.35, y: base - bh },
              { x: x + bw * 0.35, y: base - bh - h * 0.03 },
            ],
            "#45727b55",
          );
          c.fillStyle = "#b5e6c4";
          c.fillRect(x + bw * 0.35, base - bh - h * 0.03, 1.5, 1.5);
        }
        for (let row = 0; row < Math.floor(bh / 10); row++)
          for (let col = 0; col < 3; col++)
            if (seeded(i * 55 + row * 3 + col + layer * 75) > 0.55) {
              c.fillStyle = seeded(i + row) > 0.82 ? "#be9b5b55" : "#4f9caa55";
              c.fillRect(
                x + 5 + col * bw * 0.18,
                base - bh + 7 + row * 10,
                2,
                2,
              );
            }
      }
    // Haze makes the vanishing point glow through the architecture.
    const fog = c.createRadialGradient(
      w / 2,
      h * 0.38,
      0,
      w / 2,
      h * 0.38,
      h * 0.28,
    );
    fog.addColorStop(0, "#62bbbd30");
    fog.addColorStop(1, "#27738400");
    c.fillStyle = fog;
    c.fillRect(0, 0, w, h);
  }
  buildings(distance) {
    for (let i = 24; i >= 0; i--)
      for (const side of [-1, 1]) {
        const z = ((((i * 14 - distance * 0.36) % 350) + 350) % 350) - 5;
        const x = side * (6.3 + seeded(i + side * 91) * 14),
          bh = 6 + seeded(i + side * 20) * 25,
          width = 2 + seeded(i + 42) * 5;
        const p = this.project(x, 0, z);
        if (p.x < -500 || p.x > this.w + 500) continue;
        this.box(
          x,
          -8,
          z,
          width,
          bh,
          5,
          ["#0b1928", "#091422", "#102334"],
          "#28465744",
        );
        const front = z - 0.01,
          left = x - width * 0.5;
        this.line(
          [this.project(left, bh - 8, front), this.project(left, -7, front)],
          side === -1 ? "#2e7c9080" : "#365d9a70",
          1,
        );
        const k = this.project(x, 0, z).k;
        if (k < 2) continue;
        for (let row = -5; row < bh - 8; row += 1.1) {
          for (let col = 0.35; col < width - 0.2; col += 0.65)
            if (seeded(row * 17 + col * 53 + i * 3) > 0.43) {
              const p1 = this.project(left + col, row, front),
                p2 = this.project(left + col + 0.22, row + 0.15, front);
              this.ctx.fillStyle =
                seeded(i + row) > 0.78 ? "#de6cba44" : "#4dc2df44";
              this.ctx.fillRect(
                p1.x,
                p2.y,
                Math.max(1, p2.x - p1.x),
                Math.max(1, p1.y - p2.y),
              );
            }
        }
        if (i % 5 === 0) {
          const p = this.project(x, bh * 0.45 - 7, front);
          this.ctx.save();
          this.ctx.translate(p.x, p.y);
          this.ctx.rotate(side * 0.04);
          this.ctx.fillStyle = "#0c3247";
          this.ctx.fillRect(-k * 0.65, -k * 1.2, k * 1.3, k * 2.4);
          this.ctx.strokeStyle = "#65e4ed66";
          this.ctx.strokeRect(-k * 0.65, -k * 1.2, k * 1.3, k * 2.4);
          this.ctx.fillStyle = "#63d9e2";
          this.ctx.textAlign = "center";
          this.ctx.font = `${Math.max(6, k * 0.38)}px monospace`;
          this.ctx.fillText(i % 2 ? "新" : "N", 0, 0);
          this.ctx.fillText(i % 2 ? "都" : "07", 0, k * 0.55);
          this.ctx.restore();
        }
      }
  }
  road(distance, obstacles, speed = 14, difficulty = 'easy') {
    const c = this.ctx;
    const gaps = obstacles
      .filter(o => isPit(o.type) && o.position - distance < DIFFICULTIES[difficulty].revealDistance && (o.type !== 'collapse' || hazardProgress(o, distance, speed, difficulty) >= 0.62))
      .map((o) => ({
        a: o.position - distance,
        b: o.position + o.length - distance,
      }));
    // Split exactly at gap edges so the black opening matches the collision zone.
    const points = [-3, 210];
    for (let i = 0; i < 75; i++) {
      const z = i * 3 - (((distance % 3) + 3) % 3);
      if (z > -3 && z < 210) points.push(z);
    }
    for (const g of gaps) {
      if (g.a > -3 && g.a < 210) points.push(g.a);
      if (g.b > -3 && g.b < 210) points.push(g.b);
    }
    points.sort((a, b) => b - a);
    for (let i = 0; i < points.length - 1; i++) {
      const far = points[i],
        near = points[i + 1],
        mid = (near + far) / 2;
      if (gaps.some((g) => mid > g.a && mid < g.b)) {
        this.quad(-3.15, 3.15, near, far, -0.5, "#01060d");
        if (gaps.some((g) => Math.abs(near - g.a) < 0.01))
          this.line(
            [this.project(-3.15, 0, near), this.project(3.15, 0, near)],
            "#ff675d",
            2,
            8,
          );
        if (gaps.some((g) => Math.abs(far - g.b) < 0.01))
          this.line(
            [this.project(-3.15, 0, far), this.project(3.15, 0, far)],
            "#ff675d",
            2,
            8,
          );
        continue;
      }
      this.quad(
        -3.15,
        3.15,
        near,
        far,
        0,
        Math.floor((mid + distance) / 3) % 2 ? "#122331" : "#142735",
      );
      this.quad(-3.55, -3.15, near, far, -0.09, "#203b4a");
      this.quad(3.15, 3.55, near, far, -0.09, "#203b4a");
      this.line(
        [this.project(-3.12, 0.01, near), this.project(-3.12, 0.01, far)],
        "#64f4e3",
        1.4,
        5,
      );
      this.line(
        [this.project(3.12, 0.01, near), this.project(3.12, 0.01, far)],
        "#64f4e3",
        1.4,
        5,
      );
      this.line(
        [this.project(-3.56, -0.04, near), this.project(-3.56, -0.04, far)],
        "#4785aa88",
        1,
      );
      this.line(
        [this.project(3.56, -0.04, near), this.project(3.56, -0.04, far)],
        "#4785aa88",
        1,
      );
      this.line(
        [this.project(-3, 0, near), this.project(3, 0, near)],
        "#416c7c26",
        0.7,
      );
      for (const x of [-1.05, 1.05])
        this.line(
          [this.project(x, 0.015, near), this.project(x, 0.015, far)],
          "#5294a52a",
          0.8,
        );
      if (Math.floor((mid + distance) / 3) % 4 === 0)
        for (const x of [-2.85, 2.85])
          this.quad(x - 0.025, x + 0.025, near, far, 0.025, "#7eeaff99");
    }
    // Floating guard-light pylons at both sides.
    for (let i = 24; i >= 0; i--) {
      const z = i * 9 - (((distance % 9) + 9) % 9);
      if (z < -2) continue;
      for (const side of [-1, 1]) {
        const x = side * 3.43;
        this.box(x, 0, z, 0.09, 0.8, 0.13, ["#244253", "#15293a", "#3c6978"]);
        this.line(
          [this.project(x, 0.5, z), this.project(x, 0.83, z)],
          CYAN,
          Math.max(1, this.project(x, 0, z).k * 0.035),
          5,
        );
      }
    }
    // Roadway direction chevrons, travelling towards the runner.
    for (let i = 0; i < 10; i++) {
      const z = i * 20 - (((distance % 20) + 20) % 20);
      if (z < 2) continue;
      this.line(
        [
          this.project(-0.28, 0.02, z + 1),
          this.project(0, 0.02, z),
          this.project(0.28, 0.02, z + 1),
        ],
        "#80b5bd50",
        1,
      );
    }
    const haze = c.createLinearGradient(0, this.h * 0.36, 0, this.h * 0.5);
    haze.addColorStop(0, "#73b2b633");
    haze.addColorStop(1, "#64a5b000");
    c.fillStyle = haze;
    c.fillRect(this.w * 0.42, this.h * 0.36, this.w * 0.16, this.h * 0.14);
  }
  worldLine(points, color, radius, glow = 0) {
    const projected = points.map(p => this.project(p.x, p.y, p.z));
    this.line(projected, color, Math.max(1, projected.reduce((sum, p) => sum + p.k, 0) / projected.length * radius), glow);
  }
  monster(o, z, progress) {
    if (progress <= 0) return;
    const rise = Math.min(1, progress / 0.25), y = (1 - rise) * -2.8;
    const c = this.ctx;
    this.box(3.65, y + 0.65, z, 0.95, 1.25, 0.65, ['#536349', '#293d34', '#78816a'], '#8eac6f');
    for (const side of [-1, 1]) this.worldLine([{x:3.65+side*.29,y:y+.85,z:z+.2},{x:3.65+side*.42,y:y+.05,z:z-.12}], '#344239', .3);
    this.box(3.52, y + 1.93, z - 0.1, 0.84, 0.68, 0.65, ['#788963','#384d3e','#9daa7e'], '#bad18a');
    for (const x of [3.29, 3.69]) this.box(x, y + 2.29, z - 0.13, 0.15, 0.08, 0.02, ['#ff544e','#861d21','#ffc47e'], '#ffb077');
    this.worldLine([{x:3.19,y:y+2.05,z:z-.14},{x:3.84,y:y+2.05,z:z-.14}], '#101b17', .1);
    for(const x of [3.31,3.52,3.73]) this.worldLine([{x,y:y+2.1,z:z-.15},{x,y:y+1.99,z:z-.15}], '#e5d7a7', .045);
    const swing = Math.max(0, Math.min(1, (progress - .3) / .7));
    const angle = -1.5 + (1 - (1 - swing) ** 3) * 1.5;
    const grip = {x:2.75,y:y+1.57,z:z+.1};
    this.worldLine([{x:3.25,y:y+1.7,z:z+.1},{x:2.9,y:y+1.25,z:z+.45},grip], '#788b60', .25);
    const tip = {x:grip.x-Math.cos(angle)*3.85,y:y+1.57,z:grip.z+Math.sin(angle)*3.85};
    this.worldLine([grip,tip], '#6e472d', .22);
    this.worldLine([{x:grip.x+(tip.x-grip.x)*.36,y:grip.y,z:grip.z+(tip.z-grip.z)*.36},tip], '#b19068', .35, 2);
    if(progress>.65&&progress<1){c.globalAlpha=.28;this.worldLine([{x:grip.x-1,y:grip.y+.06,z:z-.7},tip], '#f5e3ae', .09, 5);c.globalAlpha=1;}
  }
  fallingTrees(o, z, progress) {
    const count = o.variant === 2 ? 2 : 1;
    for(let i=0;i<count;i++){
      const direction=i===0?1:-1, rootX=-3.35*direction, depth=z+i*.85;
      const fall=Math.min(1,Math.max(0,(progress-i*.08)/.86));
      const angle=fall*fall*Math.PI/2;
      const baseY=.08+(count===2&&i===1?fall*.84:0);
      const point=t=>({x:rootX+direction*Math.sin(angle)*t*6.35,y:baseY+Math.cos(angle)*t*6.35,z:depth+t*.22});
      this.worldLine([point(0),point(1)], '#675a40', .48);
      this.worldLine([point(.05),point(.94)], '#b19b63', .075);
      for(const t of [.4,.65,.87])for(const side of [-1,1]){
        const branch=point(t),tip={x:branch.x+side*.65,y:branch.y+Math.cos(angle)*.6+.2,z:branch.z+side*.65};
        this.worldLine([branch,tip], '#766848', .15);
        const leaf=this.project(tip.x,tip.y,tip.z),c=this.ctx;
        c.fillStyle=side===1?'#3e8060':'#285a4c';c.beginPath();c.ellipse(leaf.x,leaf.y,leaf.k*.65,leaf.k*.38,-side*.4,0,Math.PI*2);c.fill();
        this.line([{x:leaf.x-leaf.k*.3,y:leaf.y},{x:leaf.x+leaf.k*.32,y:leaf.y-leaf.k*.08}], '#99c77388', 1);
      }
      if(fall>.85&&fall<1){for(let j=0;j<5;j++){const p=this.project(rootX+direction*j*1.2,.12,depth-.25);this.ctx.fillStyle='#c7b18055';this.ctx.fillRect(p.x,p.y,3,3);}}
    }
  }
  steelCollapse(o, z, progress) {
    if(progress<=0)return;
    const impact=.62, fall=Math.min(1,progress/impact), center=z+o.length*.3;
    const altitude=11*(1-fall*fall)-(progress>impact?(progress-impact)*16:0);
    for(const x of [-.18,.18]) this.worldLine([{x:-3.1,y:altitude+x,z:center-.3},{x:3.1,y:altitude+x,z:center+.3}], '#9cacb8', .16);
    for(let i=0;i<7;i++){
      const x=-3+i;this.worldLine([{x,y:altitude-.18,z:center-.3},{x:x+.5,y:altitude+.18,z:center+.3},{x:x+1,y:altitude-.18,z:center-.3}], '#536d82', .08);
    }
    if(progress>impact){
      const burst=(progress-impact)/(1-impact);
      for(let i=0;i<12;i++){
        const x=(seeded(i+o.id)-.5)*6,depth=center+(seeded(i+61)-.5)*o.length;
        this.box(x,-burst*(1+seeded(i+33)*6),depth,.25+seeded(i)*.5,.25,.4,['#477080','#1e3a4a','#82a1a7']);
        if(burst<.6){const p=this.project(x,burst*1.5,depth);this.line([{x:p.x,y:p.y},{x:p.x+(seeded(i+77)-.5)*14,y:p.y-6}], '#ffc981', 1.3, 4);}
      }
    }
  }
  fireBar(z, time) {
    for(const x of [-3.0,3.0])this.box(x,.85,z,.35,.8,.65,['#773c26','#422d29','#b18045'],'#e2a66b');
    this.worldLine([{x:-2.85,y:1.5,z},{x:2.85,y:1.5,z}], '#ff5426', .42, 18);
    this.worldLine([{x:-2.85,y:1.5,z:z-.02},{x:2.85,y:1.5,z:z-.02}], '#ffe7a0', .12, 10);
    for(let i=0;i<25;i++){
      const x=-2.9+i*.24,flicker=.5+.5*Math.sin(time*24+i*2.3),p=(dx,y)=>this.project(x+dx,y,z-.05);
      this.poly([p(-.16,1.3),p(0,1.7+flicker*.55),p(.17,1.4),p(.08,1.05+flicker*.12)], i%2?'#ffbc49cc':'#ff6b27dd');
      if(i%3===0){const s=this.project(x,2+((time*2+i*.21)%1),z);this.ctx.fillStyle='#ffd293';this.ctx.fillRect(s.x,s.y,1.5,3);}
    }
  }
  obstacle(o, distance, time, game) {
    const z = o.position - distance;
    if (z < -3 || z > 200) return;
    const progress=hazardProgress(o,distance,game.speed,game.difficulty);
    if(o.type==='monster'){this.monster(o,z,progress);return;}
    if(o.type==='trees'){this.fallingTrees(o,z,progress);return;}
    if(o.type==='collapse'){this.steelCollapse(o,z,progress);return;}
    if(o.type==='fire'){this.fireBar(z,time);return;}
    if (o.type === "gap") {
      return;
    }
    if (o.type === "bar") {
      for (const x of [-2.8, 2.8])
        this.box(
          x,
          0,
          z,
          0.18,
          2.55,
          o.length,
          ["#3b3156", "#25273e", "#685976"],
          "#9f7ce488",
        );
      this.box(
        0,
        1.0,
        z,
        5.6,
        1.5,
        o.length,
        ["#3b2851", "#251e3c", "#66437b"],
        "#d17bff99",
      );
      this.line(
        [
          this.project(-2.65, 1.03, z - 0.01),
          this.project(2.65, 1.03, z - 0.01),
        ],
        "#ec96ff",
        2,
        12,
      );
      for (let x = -2.3; x < 2.6; x += 0.7)
        this.line(
          [
            this.project(x, 1.35, z - 0.02),
            this.project(x + 0.25, 1.6, z - 0.02),
            this.project(x + 0.5, 1.35, z - 0.02),
          ],
          "#ce91e6bb",
          1.3,
        );
    } else {
      const high = o.type === "high",
        height = high ? 1.8 : 0.72;
      this.box(
        0,
        0,
        z,
        5.55,
        height,
        o.length,
        high
          ? ["#704f2c", "#352d2c", "#9e7444"]
          : ["#24505a", "#173a48", "#387384"],
        high ? "#f8be7b99" : "#69e4ee88",
      );
      const color = high ? "#ffc17b" : "#81f4f0";
      this.line(
        [
          this.project(-2.76, height, z - 0.01),
          this.project(2.76, height, z - 0.01),
        ],
        color,
        2,
        10,
      );
      for (let x = -2.7; x < 2.5; x += 0.5) {
        const p = (a, b) => this.project(a, b, z - 0.015);
        this.poly(
          [
            p(x, 0.05),
            p(x + 0.15, 0.05),
            p(x + 0.15 + height * 0.5, height - 0.05),
            p(x + height * 0.5, height - 0.05),
          ],
          high ? "#d6a25d66" : "#83d8dc33",
        );
      }
      this.box(0, height * 0.22, z - 0.04, 0.56, height * 0.56, 0.035, [
        "#101f2b",
        "#152b36",
        "#244453",
      ]);
    }
  }
  character(game, time, preview) {
    const c = this.ctx,
      fall = (game.status === 'falling' || game.status === 'over') && isPit(game.reason);
    const fallTime = game.fallTime || 0;
    if(fall && fallTime>=RULES.fallDuration) return;
    const y = game.y;
    const slide = !fall && game.sliding;
    const airborne = fall || game.y > 0.02;
    const fallDepth = fall ? fallTime*2.3 : 0;
    if(fall){
      // The near road edge occludes the body as it drops into the opening.
      const pit = game.obstacles.find(o=>isPit(o.type)&&o.position<=game.distance&&o.position+o.length>=game.distance);
      const nearEdge = this.project(0,0,pit?pit.position-game.distance:0).y;
      c.save();c.beginPath();c.rect(0,0,this.w,Math.min(this.h,nearEdge));c.clip();
      c.globalAlpha = Math.max(0,1-Math.max(0,fallTime-.35)/.5);
    }
    // Cadence follows travelled distance as speed rises; paused poses stay frozen.
    const phase = preview ? time * 11.4 : runnerPhase(game.distance, fall?game.elapsed:time);
    const elapsed = this.lastPoseTime === undefined ? 0 : Math.max(0, Math.min(.05, time-this.lastPoseTime));
    if(this.lastPoseTime === undefined || time<this.lastPoseTime || slide) this.airBlend = 0;
    this.lastPoseTime = time;
    this.airBlend += ((airborne ? 1 : 0)-this.airBlend)*(1-Math.exp(-elapsed*18));
    const pose = fall ? runnerFallPose(phase,fallTime) : runnerPose(phase, this.airBlend);
    const p = (x, dy, z = 0) => {
      const point = slide ? { x, y: dy, z } : runnerBodyPoint(pose, { x, y: dy, z });
      return this.project(point.x, point.y + y, point.z+fallDepth);
    };
    const shadow = this.project(0, 0, fallDepth);
    c.save();
    c.globalAlpha = fall ? 0 : 0.5 / (1 + Math.max(0,y) * 0.8);
    c.fillStyle = "#01090f";
    c.beginPath();
    c.ellipse(
      shadow.x,
      shadow.y + 3,
      shadow.k * (slide ? 0.65 : 0.5),
      shadow.k * 0.12,
      0,
      0,
      Math.PI * 2,
    );
    c.fill();
    c.restore();
    if (slide) {
      this.line(
        [p(-0.48, 0.1), p(0.1, 0.18), p(0.3, 0.25)],
        "#244353",
        shadow.k * 0.15,
      );
      this.line(
        [p(-0.1, 0.2), p(0.5, 0.23), p(0.75, 0.08)],
        "#172a3d",
        shadow.k * 0.16,
      );
      this.box(
        0,
        y + 0.2,
        -0.05,
        0.55,
        0.35,
        0.65,
        ["#263c4d", "#172a3a", "#52707a"],
        "#91cad077",
      );
      this.box(
        0.02,
        y + 0.29,
        0.45,
        0.3,
        0.29,
        0.3,
        ["#213b50", "#1a2c40", "#688187"],
        "#89cfd599",
      );
      this.line(
        [p(-0.25, 0.28, -0.15), p(-0.55, 0.15, -0.35)],
        "#b4ff79",
        2,
        8,
      );
      return;
    }
    const joint = point => this.project(point.x, point.y + y, point.z+fallDepth);
    const drawBoot = leg => {
      const co = Math.cos(leg.bootPitch), si = Math.sin(leg.bootPitch);
      const point = (x, y, z) => joint({ x: leg.foot.x + x, y: leg.foot.y + y * co - z * si, z: leg.foot.z + y * si + z * co });
      const width = 0.105 + leg.lift * 0.025;
      const sole = [point(-width, -.045, -.12), point(width, -.045, -.12), point(width, -.045, .19), point(width*.65, -.045, .24), point(-width*.65, -.045, .24), point(-width, -.045, .19)];
      this.poly([point(-width,.07,-.12),point(width,.07,-.12),point(width,.07,.2),point(-width,.07,.2)], '#243d4d', '#7b9ba666');
      this.poly([point(-width,.07,.2),point(width,.07,.2),point(width,-.045,.2),point(-width,-.045,.2)], '#172737');
      this.poly([point(-width,.07,-.12),point(width,.07,-.12),point(width,-.045,-.12),point(-width,-.045,-.12)], '#172737', '#6e8b9666');
      if(leg.bootPitch>0.65){
        this.poly(sole, '#111e2b', '#a4d48b');
        for(const z of [-.065,.015,.095,.175]) this.line([point(-width*.7,-.05,z),point(width*.7,-.05,z)], '#57717b', Math.max(1,shadow.k*.022));
      }
      this.line([point(-width,-.05,-.105),point(width,-.05,-.105)], '#bdff87', Math.max(1,shadow.k*.025), 4);
    };
    // Draw the farther leg first for a clean, natural crossing of the stride.
    for (const leg of [...pose.legs].sort((a, b) => b.foot.z - a.foot.z)) {
      const { side } = leg;
      const hip = joint(leg.hip), knee = joint(leg.knee), foot = joint(leg.foot);
      this.line([hip, knee], "#152538", shadow.k * 0.17);
      this.line([knee, foot], "#283f50", shadow.k * 0.14);
      this.line([hip, knee], "#567b8b", shadow.k * 0.045);
      c.fillStyle = "#7295a0";
      c.beginPath(); c.arc(knee.x, knee.y, shadow.k * 0.075, 0, Math.PI * 2); c.fill();
      this.line(
        [knee, { x: foot.x, y: foot.y - shadow.k * 0.06 }],
        "#78c6d1",
        shadow.k * 0.035,
        3,
      );
      if(leg.lift<0.5) drawBoot(leg);
    }
    const drawArm = arm => {
      const shoulder = p(arm.shoulder.x, arm.shoulder.y, arm.shoulder.z);
      const elbow = p(arm.elbow.x, arm.elbow.y, arm.elbow.z);
      const hand = p(arm.hand.x, arm.hand.y, arm.hand.z);
      this.line([shoulder, elbow], '#385667', shadow.k * 0.15);
      this.line([elbow, hand], '#203b50', shadow.k * 0.12);
      this.line([elbow, hand], '#9ceec8', shadow.k * 0.025, 4);
      c.fillStyle = '#7295a0'; c.beginPath(); c.arc(elbow.x, elbow.y, shadow.k * 0.065, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#6b9da8'; c.beginPath(); c.arc(hand.x, hand.y, shadow.k * 0.067, 0, Math.PI * 2); c.fill();
    };
    const farArm = arm => arm.elbow.z + arm.hand.z > arm.shoulder.z * 2;
    for (const arm of pose.arms.filter(farArm)) drawArm(arm);
    // Back view of one runner: armored jacket, cyan seams, lime energy spine.
    const torso = [
      p(-0.28, 1.42),
      p(0.28, 1.42),
      p(0.21, 0.93),
      p(-0.21, 0.93),
    ];
    this.poly(torso, "#263d4e", "#6b9aa777");
    this.poly(
      [p(-0.28, 1.42), p(-0.14, 1.38), p(-0.1, 1.0), p(-0.21, 0.93)],
      "#3b5a67",
    );
    this.poly(
      [p(0.28, 1.42), p(0.14, 1.38), p(0.1, 1.0), p(0.21, 0.93)],
      "#162b40",
    );
    this.line(
      [p(-0.23, 1.34), p(0, 1.22), p(0.23, 1.34)],
      "#a9ff8b",
      shadow.k * 0.025,
      6,
    );
    this.line([p(0, 1.31), p(0, 1.01)], "#c1ff91", shadow.k * 0.045, 8);
    this.box(
      0,
      0.93,
      -0.04,
      0.45,
      0.12,
      0.16,
      ["#162a3b", "#112132", "#344d57"],
      "#72a6ae66",
      p,
    );
    for (const arm of pose.arms.filter(arm => !farArm(arm))) drawArm(arm);
    for (const leg of pose.legs.filter(leg => leg.lift>=0.5)) drawBoot(leg);
    const headPose = { ...pose, roll: pose.roll*.35, twist: pose.twist*.5, pelvisHeight: pose.pelvisHeight-pose.bob*.55 };
    const headPoint = (x, dy, z = 0) => { const point=runnerBodyPoint(headPose,{x,y:dy,z});return this.project(point.x,point.y+y,point.z+fallDepth); };
    this.box(0, 1.34, -0.03, 0.17, 0.13, 0.2, [
      "#182d3d",
      "#132b3b",
      "#3b5d68",
    ], undefined, headPoint);
    this.box(
      0,
      1.43,
      -0.13,
      0.35,
      0.34,
      0.35,
      ["#283f50", "#15283e", "#789097"],
      "#86b8bc66",
      headPoint,
    );
    this.line(
      [headPoint(-0.175, 1.58, -0.14), headPoint(0.175, 1.58, -0.14)],
      "#6aeef0",
      shadow.k * 0.025,
      6,
    );
    this.line(
      [headPoint(-0.08, 1.74, -0.15), headPoint(0.09, 1.74, -0.15)],
      "#b5ff8f",
      shadow.k * 0.025,
      4,
    );
    if (airborne && !fall) {
      for (let i = 0; i < 4; i++) {
        const pp = p((seeded(i + 15) - 0.5) * 0.5, -0.2 - i * 0.18, -0.1);
        c.fillStyle = `rgba(169,255,184,${0.35 - i * 0.07})`;
        c.fillRect(pp.x, pp.y, 2, 6);
      }
    }
    if (preview) {
      const pp = this.project(0, 0.02, 0);
      c.strokeStyle = "#93f3d944";
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(pp.x, pp.y, shadow.k * 0.8, shadow.k * 0.15, 0, 0, Math.PI * 2);
      c.stroke();
    }
    if(fall) c.restore();
  }
  render(game, time) {
    const preview = game.status === "ready";
    const distance = preview ? (this.reduced ? 0 : time * 2) : game.distance;
    this.sky(time);
    this.buildings(distance);
    this.road(distance, preview ? [] : game.obstacles, game.speed, game.difficulty);
    if (!preview) {
      const list = game.obstacles
        .filter(o => o.position + o.length - game.distance > -3 && o.position - game.distance < DIFFICULTIES[game.difficulty].revealDistance)
        .slice()
        .sort((a, b) => b.position - a.position);
      let drawn = false;
      for (const o of list) {
        if (o.position - game.distance < (o.type === 'monster' ? 0.7 : 0) && !drawn) {
          this.character(game, time, false);
          drawn = true;
        }
        this.obstacle(o, game.distance, time, game);
      }
      if (!drawn) this.character(game, time, false);
    } else {
      this.character(game, time, true);
    }
    // Fine screen grain, restrained scanlines and a HUD frame.
    const c = this.ctx;
    c.fillStyle = "#a5e8e902";
    for (let y = 0; y < this.h; y += 4) c.fillRect(0, y, this.w, 1);
    const len = 13;
    c.strokeStyle = "#8ac5c555";
    c.lineWidth = 1;
    for (const [x, y, sx, sy] of [
      [10, 10, 1, 1],
      [this.w - 10, 10, -1, 1],
      [10, this.h - 10, 1, -1],
      [this.w - 10, this.h - 10, -1, -1],
    ])
      this.line(
        [
          { x, y: y + sy * len },
          { x, y },
          { x: x + sx * len, y },
        ],
        "#8ac5c555",
      );
  }
}
