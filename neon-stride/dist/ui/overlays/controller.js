import { DIFFICULTIES } from "../../config/difficulties.js";
import {
  ARENA_STATES,
  LOCKED_STATES,
  STATUS_TEXT,
} from "../../config/interface.js";
import { showResults } from "../results/controller.js";

export function syncState(context) {
  const { get, arena, game, session } = context,
    state = game.status;
  for (const [name, status] of Object.entries(ARENA_STATES))
    arena.classList.toggle(name, state === status);
  get("overlay").hidden = ["running", "falling"].includes(state);
  for (const [id, status] of Object.entries({
    intro: "ready",
    result: "over",
    paused: "paused",
  })) {
    get(id).hidden = state !== status;
  }

  get("pause").disabled = !["running", "paused"].includes(state);
  get("pause").textContent = state === "paused" ? "▷" : "Ⅱ";
  get("pause").setAttribute(
    "aria-label",
    state === "paused" ? "계속 달리기" : "일시 정지",
  );
  get("status").textContent = STATUS_TEXT[state];
  get("jumpIndicator").hidden = state !== "running";
  if (state === "over" && session.lastStatus !== "over") showResults(context);
  for (const id of Object.keys(DIFFICULTIES))
    get("difficulty-" + id).disabled = LOCKED_STATES.includes(state);
  session.lastStatus = state;
}
