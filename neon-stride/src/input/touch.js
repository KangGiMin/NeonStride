import { SWIPE_THRESHOLD } from "../config/controls.js";

export function bindTouch({ get, jump, slide, events }) {
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
  let origin;
  events.on(get("scene"), "pointerdown", (event) => {
    if (event.pointerType !== "mouse")
      origin = { x: event.clientX, y: event.clientY };
  });
  events.on(get("scene"), "pointerup", (event) => {
    if (!origin) return;
    const dy = event.clientY - origin.y;
    origin = null;
    if (dy > SWIPE_THRESHOLD) slide();
    else jump();
  });
  events.on(get("scene"), "pointercancel", () => {
    origin = null;
  });
}
