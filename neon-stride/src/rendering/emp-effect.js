import { seeded } from "./shared.js";

export function empEffect(scene, game, time) {
  if (!game.empStrength) return;
  const c = scene.ctx,
    tick = Math.floor(time * 12);
  c.save();
  c.globalAlpha = game.empStrength * (scene.reduced ? 0.03 : 0.12);
  for (let i = 0; i < 16; i++) {
    const y = seeded(tick * 19 + i) * scene.h;
    c.fillStyle = i % 2 ? "#bf8bff" : "#62efff";
    c.fillRect(
      seeded(tick + i) * scene.w,
      y,
      scene.w * (0.08 + seeded(i + tick) * 0.28),
      1 + seeded(i) * 3,
    );
  }
  if (!scene.reduced) {
    const ratio = scene.canvas.width / scene.w;
    for (let i = 0; i < 3; i++) {
      const y = seeded(tick * 7 + i) * Math.max(1, scene.h - 10),
        height = 3 + i * 2;
      c.drawImage(
        scene.canvas,
        0,
        y * ratio,
        scene.canvas.width,
        height * ratio,
        (((tick + i) % 3) - 1) * 5,
        y,
        scene.w,
        height,
      );
    }
  }
  c.restore();
}
