import { seeded } from "../shared.js";

export function sky(scene, time) {
  const c = scene.ctx,
    w = scene.w,
    h = scene.h;
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
    scene.line(
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
        scene.line(
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
            c.fillRect(x + 5 + col * bw * 0.18, base - bh + 7 + row * 10, 2, 2);
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
