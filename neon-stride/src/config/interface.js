export const HUD = Object.freeze({
  digits: 6,
  refreshMs: 33,
  baseBars: 2,
  speedPerBar: 2,
});
export const STATUS_TEXT = Object.freeze({
  ready: "READY TO CONNECT",
  running: "RUN IN PROGRESS",
  paused: "CONNECTION PAUSED",
  over: "RUN TERMINATED",
  falling: "SIGNAL LOST",
});
export const ARENA_STATES = Object.freeze({
  playing: "running",
  falling: "falling",
  over: "over",
  paused: "paused",
});
export const LOCKED_STATES = Object.freeze(["running", "paused", "falling"]);
export const FAILURE_TEXT = Object.freeze({
  low: "방벽에 부딪혔습니다. 점프로 뛰어넘으세요.",
  high: "높은 방벽입니다. 공중에서 한 번 더 점프하세요.",
  bar: "낮게 숙이세요. 슬라이딩으로 통과할 수 있습니다.",
  gap: "도로가 끊겼습니다. 2단 점프로 건너세요.",
  monster: "괴물의 방망이에 맞았습니다. 슬라이딩하거나 2단 점프로 피하세요.",
  trees: "쓰러진 나무에 부딪혔습니다. 나무 더미를 뛰어넘으세요.",
  collapse: "철골이 도로를 무너뜨렸습니다. 2단 점프로 건너세요.",
  fire: "가로 불기둥에 닿았습니다. 슬라이딩으로 아래를 통과하세요.",
  corner: "코너를 벗어났습니다. 방향 안내에 맞춰 Shift + ← 또는 →를 누르세요.",
  energy: "에너지 파괴광선에 닿았습니다. 2단 점프로 광선 위를 넘으세요.",
  patrol: "순찰 드론에 포착됐습니다. 좌우로 이동해 비어 있는 경로를 찾으세요.",
  shutter:
    "셔터에 끼었습니다. 닫히는 문은 슬라이드, 열리는 문은 점프로 통과하세요.",
  airstrike:
    "공중 드론의 레이저에 맞았습니다. 바닥의 붉은 조준 위치에서 옆으로 피하세요.",
});
