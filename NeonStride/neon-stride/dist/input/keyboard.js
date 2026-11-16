import { KEYS, GAME_KEYS } from "../config/controls.js";

export function bindKeyboard({
  get,
  game,
  start,
  jump,
  slide,
  togglePause,
  events,
}) {
  events.on(document, "keydown", (event) => {
    if (get("helpDialog").open) return;
    if (event.code === "Space" && event.target?.closest?.(".difficulty-option"))
      return;
    if (GAME_KEYS.includes(event.code)) event.preventDefault();
    if (event.repeat) return;
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
    if (KEYS.slide.includes(event.code)) game.slideHeld = false;
  });
}
