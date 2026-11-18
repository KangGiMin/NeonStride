export const SOUND_CUES = Object.freeze({
  start: [550, 0.16, "triangle"],
  jump: [520, 0.15, "triangle"],
  doubleJump: [800, 0.15, "triangle"],
  slide: [180, 0.13, "sawtooth", 0.025],
  over: [120, 0.45, "sawtooth", 0.055],
  toggle: [650, 0.1],
  turn: [420, 0.2, "triangle", 0.04],
});
export const SOUND_ICONS = Object.freeze({
  on: '<path d="M11 5 6 9H3v6h3l5 4V5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  off: '<path d="M11 5 6 9H3v6h3l5 4V5ZM16 9l5 6m0-6-5 6"/>',
});
