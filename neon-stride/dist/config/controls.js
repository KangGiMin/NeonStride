export const KEYS = Object.freeze({
  jump: ["Space", "ArrowUp", "KeyW"],
  slide: ["ArrowDown", "KeyS"],
  pause: ["KeyP", "Escape"],
  left: ["ArrowLeft"],
  right: ["ArrowRight"],
});
export const GAME_KEYS = Object.values(KEYS).flat();
export const SWIPE_THRESHOLD = 35;
