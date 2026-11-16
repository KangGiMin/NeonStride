export const KEYS = Object.freeze({
  jump: ["Space", "ArrowUp", "KeyW"],
  slide: ["ArrowDown", "KeyS"],
  pause: ["KeyP", "Escape"],
});
export const GAME_KEYS = Object.values(KEYS).flat();
export const SWIPE_THRESHOLD = 35;
