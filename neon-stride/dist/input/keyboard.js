import { KEYS, GAME_KEYS } from "../config/controls.js";

export function bindKeyboard({
  get,
  game,
  start,
  jump,
  slide,
  turn,
  togglePause,
  events,
}) {
  const held = new Set();
  const steer = () =>
    game.move(Number(held.has("ArrowRight")) - Number(held.has("ArrowLeft")));
  events.on(window, "blur", () => {
    held.clear();
    game.move(0);
  });
  events.on(document, "keydown", (event) => {
    if (get("helpDialog").open) return;
    if (event.target?.closest?.("input, textarea, select, [contenteditable]"))
      return;
    if (
      event.code === "Space" &&
      event.target?.closest?.("button, a, [role=button]")
    )
      return;
    if (GAME_KEYS.includes(event.code)) event.preventDefault();
    if (event.repeat) return;
    if (["ArrowLeft", "ArrowRight"].includes(event.code)) {
      if (event.shiftKey) {
        held.clear();
        game.move(0);
        turn(event.code === "ArrowLeft" ? -1 : 1);
      } else {
        held.add(event.code);
        steer();
      }
      return;
    }
    if (["ShiftLeft", "ShiftRight"].includes(event.code)) {
      if (held.size) {
        const direction = held.has("ArrowRight") ? 1 : -1;
        held.clear();
        game.move(0);
        turn(direction);
      }
      return;
    }
    if (KEYS.pause.includes(event.code)) {
      togglePause();
      return;
    }
    if (KEYS.jump.includes(event.code)) {
      if (["ready", "over"].includes(game.status)) start();
      else if (game.status === "paused") togglePause();
      else jump();
    }
    if (KEYS.slide.includes(event.code)) slide(true);
  });
  events.on(document, "keyup", (event) => {
    held.delete(event.code);
    if (["ArrowLeft", "ArrowRight"].includes(event.code)) steer();
    if (KEYS.slide.includes(event.code)) game.slideHeld = false;
  });
}
