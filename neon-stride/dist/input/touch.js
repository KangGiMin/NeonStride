import { SWIPE_THRESHOLD } from "../config/controls.js";
import { turnWindow } from "../game/navigation/movement.js";
import { NAVIGATION } from "../config/navigation.js";

export function bindTouch({ get, game, jump, slide, turn, events }) {
  for (const [id, action] of [
    ["touchJump", jump],
    ["touchSlide", slide],
  ]) {
    events.on(get(id), "pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      action();
    });
  }
  for (const [id, direction] of [
    ["touchLeft", -1],
    ["touchRight", 1],
  ]) {
    const button = get(id);
    events.on(button, "pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      button.setPointerCapture?.(event.pointerId);
      if (turnWindow(game)?.open) turn(direction);
      else game.move(direction);
    });
    for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
      events.on(button, name, () => game.move(0));
  }
  let origin;
  events.on(get("scene"), "pointerdown", (event) => {
    if (event.pointerType !== "mouse")
      origin = { x: event.clientX, y: event.clientY };
  });
  events.on(get("scene"), "pointerup", (event) => {
    if (!origin) return;
    const dy = event.clientY - origin.y,
      dx = event.clientX - origin.x;
    origin = null;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (turnWindow(game)?.open) turn(Math.sign(dx));
      else {
        game.x = Math.max(
          -NAVIGATION.lateralLimit,
          Math.min(
            NAVIGATION.lateralLimit,
            game.x + Math.sign(dx) * NAVIGATION.lanes[2],
          ),
        );
      }
    } else if (dy > SWIPE_THRESHOLD) slide();
    else jump();
  });
  events.on(get("scene"), "pointercancel", () => {
    origin = null;
  });
}
