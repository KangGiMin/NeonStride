import { DIFFICULTIES } from "../config/difficulties.js";

export function render(scene, game, time) {
  const preview = game.status === "ready";
  const distance = preview ? (scene.reduced ? 0 : time * 2) : game.distance;
  scene.sky(time);
  scene.buildings(distance);
  scene.road(
    distance,
    preview ? [] : game.obstacles,
    game.speed,
    game.difficulty,
  );
  if (!preview) {
    const list = game.obstacles
      .filter(
        (o) =>
          o.position + o.length - game.distance > -3 &&
          o.position - game.distance <
            DIFFICULTIES[game.difficulty].revealDistance,
      )
      .slice()
      .sort((a, b) => b.position - a.position);
    let drawn = false;
    for (const o of list) {
      if (
        o.position - game.distance < (o.type === "monster" ? 0.7 : 0) &&
        !drawn
      ) {
        scene.character(game, time, false);
        drawn = true;
      }
      scene.obstacle(o, game.distance, time, game);
    }
    if (!drawn) scene.character(game, time, false);
  } else {
    scene.character(game, time, true);
  }
  // Fine screen grain, restrained scanlines and a HUD frame.
  const c = scene.ctx;
  c.fillStyle = "#a5e8e902";
  for (let y = 0; y < scene.h; y += 4) c.fillRect(0, y, scene.w, 1);
  const len = 13;
  c.strokeStyle = "#8ac5c555";
  c.lineWidth = 1;
  for (const [x, y, sx, sy] of [
    [10, 10, 1, 1],
    [scene.w - 10, 10, -1, 1],
    [10, scene.h - 10, 1, -1],
    [scene.w - 10, scene.h - 10, -1, -1],
  ])
    scene.line(
      [
        { x, y: y + sy * len },
        { x, y },
        { x: x + sx * len, y },
      ],
      "#8ac5c555",
    );
}
