export function fallingTrees(scene, o, z, progress) {
  const count = o.variant === 2 ? 2 : 1;
  for (let i = 0; i < count; i++) {
    const direction = i === 0 ? 1 : -1,
      rootX = -3.35 * direction,
      depth = z + i * 0.85;
    const fall = Math.min(1, Math.max(0, (progress - i * 0.08) / 0.86));
    const angle = (fall * fall * Math.PI) / 2;
    const baseY = 0.08 + (count === 2 && i === 1 ? fall * 0.84 : 0);
    const point = (t) => ({
      x: rootX + direction * Math.sin(angle) * t * 6.35,
      y: baseY + Math.cos(angle) * t * 6.35,
      z: depth + t * 0.22,
    });
    scene.worldLine([point(0), point(1)], "#675a40", 0.48);
    scene.worldLine([point(0.05), point(0.94)], "#b19b63", 0.075);
    for (const t of [0.4, 0.65, 0.87])
      for (const side of [-1, 1]) {
        const branch = point(t),
          tip = {
            x: branch.x + side * 0.65,
            y: branch.y + Math.cos(angle) * 0.6 + 0.2,
            z: branch.z + side * 0.65,
          };
        scene.worldLine([branch, tip], "#766848", 0.15);
        const leaf = scene.project(tip.x, tip.y, tip.z),
          c = scene.ctx;
        c.fillStyle = side === 1 ? "#3e8060" : "#285a4c";
        c.beginPath();
        c.ellipse(
          leaf.x,
          leaf.y,
          leaf.k * 0.65,
          leaf.k * 0.38,
          -side * 0.4,
          0,
          Math.PI * 2,
        );
        c.fill();
        scene.line(
          [
            { x: leaf.x - leaf.k * 0.3, y: leaf.y },
            { x: leaf.x + leaf.k * 0.32, y: leaf.y - leaf.k * 0.08 },
          ],
          "#99c77388",
          1,
        );
      }
    if (fall > 0.85 && fall < 1) {
      for (let j = 0; j < 5; j++) {
        const p = scene.project(
          rootX + direction * j * 1.2,
          0.12,
          depth - 0.25,
        );
        scene.ctx.fillStyle = "#c7b18055";
        scene.ctx.fillRect(p.x, p.y, 3, 3);
      }
    }
  }
}
