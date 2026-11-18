import { routeFrame } from "../game/navigation/route.js";
import { NAVIGATION } from "../config/navigation.js";

export function configureView(scene, game, preview) {
  scene.playerX = preview ? 0 : game.x;
  if (preview) {
    scene.view = null;
    return;
  }
  let heading = game.heading;
  if (game.turnAnimation) {
    const t = Math.min(1, game.turnAnimation.elapsed / NAVIGATION.turnDuration);
    heading -=
      ((game.turnAnimation.direction * Math.PI) / 2) *
      (1 - t * t * (3 - 2 * t));
  }
  scene.view = {
    game,
    camera: routeFrame(game.corners, game.distance),
    sin: Math.sin(heading),
    cos: Math.cos(heading),
  };
}

export function worldToView(view, x, z) {
  const dx = x - view.camera.x,
    dz = z - view.camera.z;
  return { x: dx * view.cos - dz * view.sin, z: dx * view.sin + dz * view.cos };
}

export function routeToView(view, x, z) {
  const frame = routeFrame(view.game.corners, view.game.distance + z);
  return worldToView(
    view,
    frame.x + x * Math.cos(frame.heading),
    frame.z - x * Math.sin(frame.heading),
  );
}
