import { HUD } from "../config/interface.js";

export function createLoop({
  game,
  scene,
  session,
  sync,
  updateHud,
  requestFrame = requestAnimationFrame,
}) {
  let animationTime = 0,
    frameTime = 0,
    lastDraw = 0,
    stopped = false;
  function animate(timestamp) {
    if (stopped) return;
    const dt = frameTime ? Math.max(0, (timestamp - frameTime) / 1000) : 0;
    frameTime = timestamp;
    if (["running", "ready", "falling"].includes(game.status))
      animationTime += dt;
    if (["running", "falling"].includes(game.status)) {
      game.update(dt);
      if (game.status !== session.lastStatus) sync();
    }
    if (timestamp - lastDraw > HUD.refreshMs) {
      updateHud();
      lastDraw = timestamp;
    }
    scene.render(game, animationTime);
    requestFrame(animate);
  }
  return {
    start() {
      requestFrame(animate);
    },
    reset() {
      animationTime = 0;
    },
    stop() {
      stopped = true;
    },
  };
}
