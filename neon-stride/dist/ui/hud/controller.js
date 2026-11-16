import { RULES } from "../../config/rules.js";
import { HUD } from "../../config/interface.js";
import { formatScore } from "../../shared/format.js";

export function updateHud(get, game) {
  get("score").textContent = formatScore(game.score);
  get("speed").textContent = (game.speed / RULES.initialSpeed).toFixed(2);
  const litBars =
    HUD.baseBars +
    Math.floor((game.speed - RULES.initialSpeed) / HUD.speedPerBar);
  [...get("speedBars").children].forEach((bar, i) =>
    bar.classList.toggle("on", i < litBars),
  );
  [...get("jumpIndicator").children].forEach((dot, i) =>
    dot.classList.toggle("used", i < game.jumps),
  );
}
