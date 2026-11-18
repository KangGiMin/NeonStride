import { turnWindow } from "../../game/navigation/movement.js";
import { NAVIGATION } from "../../config/navigation.js";

export function updateNavigationHud(get, game) {
  const window = turnWindow(game),
    visible =
      game.status === "running" &&
      window &&
      window.seconds <= NAVIGATION.warningSeconds;
  const cue = get("routeCue");
  cue.hidden = !visible;
  cue.classList.toggle("turn-now", Boolean(window?.open));
  if (visible) {
    const right = window.corner.direction === 1;
    get("routeArrow").textContent = right ? "↱" : "↰";
    get("routeInstruction").textContent = window.corner.queued
      ? "회전 준비 완료"
      : `SHIFT + ${right ? "→" : "←"} · ${right ? "우회전" : "좌회전"}`;
    get("routeDistance").textContent = window.corner.queued
      ? "교차로에서 90° 회전합니다"
      : window.open
        ? "지금 코너링!"
        : `${Math.max(0, Math.ceil(window.seconds))}초 후 코너 · 노란 표식에서 입력`;
  }
  const hazard = get("hazardCue");
  const next = game.obstacles.find(
    (o) =>
      ["energy", "emp", "patrol", "shutter", "airstrike"].includes(o.type) &&
      o.position + o.length > game.distance &&
      o.position - game.distance < game.speed * 2.6,
  );
  hazard.hidden = game.status !== "running" || (!next && !game.empStrength);
  if (!hazard.hidden)
    hazard.textContent = game.empStrength
      ? "EMP 간섭 · 조작은 정상입니다"
      : {
          energy: "ENERGY BEAM · 2단 점프",
          emp: "EMP ZONE · 시야 간섭 주의",
          patrol: "PATROL · ← → 빈 공간으로 회피",
          shutter:
            next.variant === 2 ? "셔터 열림 · 점프" : "셔터 닫힘 · 슬라이드",
          airstrike: "드론 3대 접근 · 붉은 조준점에서 옆으로 이동",
        }[next.type];
}
