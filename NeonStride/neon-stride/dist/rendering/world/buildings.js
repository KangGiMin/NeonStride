import { seeded } from "../shared.js";

export function buildings(scene, distance) {
  for (let i = 24; i >= 0; i--)
    for (const side of [-1, 1]) {
      const z = ((((i * 14 - distance * 0.36) % 350) + 350) % 350) - 5;
      const x = side * (6.3 + seeded(i + side * 91) * 14),
        bh = 6 + seeded(i + side * 20) * 25,
        width = 2 + seeded(i + 42) * 5;
      const p = scene.project(x, 0, z);
      if (p.x < -500 || p.x > scene.w + 500) continue;
      scene.box(
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
      scene.line(
        [scene.project(left, bh - 8, front), scene.project(left, -7, front)],
        side === -1 ? "#2e7c9080" : "#365d9a70",
        1,
      );
      const k = scene.project(x, 0, z).k;
      if (k < 2) continue;
      for (let row = -5; row < bh - 8; row += 1.1) {
        for (let col = 0.35; col < width - 0.2; col += 0.65)
          if (seeded(row * 17 + col * 53 + i * 3) > 0.43) {
            const p1 = scene.project(left + col, row, front),
              p2 = scene.project(left + col + 0.22, row + 0.15, front);
            scene.ctx.fillStyle =
              seeded(i + row) > 0.78 ? "#de6cba44" : "#4dc2df44";
            scene.ctx.fillRect(
              p1.x,
              p2.y,
              Math.max(1, p2.x - p1.x),
              Math.max(1, p1.y - p2.y),
            );
          }
      }
      if (i % 5 === 0) {
        const p = scene.project(x, bh * 0.45 - 7, front);
        scene.ctx.save();
        scene.ctx.translate(p.x, p.y);
        scene.ctx.rotate(side * 0.04);
        scene.ctx.fillStyle = "#0c3247";
        scene.ctx.fillRect(-k * 0.65, -k * 1.2, k * 1.3, k * 2.4);
        scene.ctx.strokeStyle = "#65e4ed66";
        scene.ctx.strokeRect(-k * 0.65, -k * 1.2, k * 1.3, k * 2.4);
        scene.ctx.fillStyle = "#63d9e2";
        scene.ctx.textAlign = "center";
        scene.ctx.font = `${Math.max(6, k * 0.38)}px monospace`;
        scene.ctx.fillText(i % 2 ? "新" : "N", 0, 0);
        scene.ctx.fillText(i % 2 ? "都" : "07", 0, k * 0.55);
        scene.ctx.restore();
      }
    }
}
