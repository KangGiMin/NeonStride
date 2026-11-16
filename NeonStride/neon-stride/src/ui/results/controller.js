import { isPit } from "../../game/obstacles/catalog.js";
import { FAILURE_TEXT } from "../../config/interface.js";
import {
  formatScore,
  formatTime,
  formatDistance,
} from "../../shared/format.js";

export function showResults({ get, arena, game, session, records, sound }) {
  arena.classList.toggle("impact", !isPit(game.reason));
  get("finalScore").textContent = game.score.toLocaleString("ko-KR");
  get("finalTime").textContent = formatTime(game.elapsed);
  get("finalDistance").textContent = formatDistance(game.distance);
  get("finalCleared").textContent = game.cleared;
  get("reason").textContent = FAILURE_TEXT[game.reason];
  get("newBest").hidden = !(game.score > session.previousBest);
  if (game.score > session.best) {
    session.best = game.score;
    get("best").textContent = formatScore(session.best);
    records.write(game.difficulty, session.best);
  }
  sound.play("over");
}
