import { DIFFICULTIES } from "../../config/difficulties.js";
import { LOCKED_STATES } from "../../config/interface.js";
import { formatScore } from "../../shared/format.js";

export function bindDifficulty({ get, game, session, records, events }) {
  for (const id of Object.keys(DIFFICULTIES)) {
    events.on(get("difficulty-" + id), "click", () => {
      if (LOCKED_STATES.includes(game.status)) return;
      session.difficulty = id;
      session.best = records.read(id);
      get("best").textContent = formatScore(session.best);
      get("difficultyDetail").textContent = DIFFICULTIES[id].description;
      for (const choice of Object.keys(DIFFICULTIES)) {
        get("difficulty-" + choice).setAttribute(
          "aria-pressed",
          String(choice === id),
        );
      }
      get("difficulty-" + id).blur();
    });
  }
}
