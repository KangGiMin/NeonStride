import { Runner } from "../game/runner.js";
import { Scene } from "../rendering/scene.js";
import { DEFAULT_DIFFICULTY } from "../config/difficulties.js";
import { createEvents } from "../shared/events.js";
import { formatScore } from "../shared/format.js";
import { createRecords } from "../services/records.js";
import { createAudio } from "../services/audio.js";
import { updateHud } from "../ui/hud/controller.js";
import { syncState } from "../ui/overlays/controller.js";
import { bindDifficulty } from "../ui/difficulty/controller.js";
import { bindHelp } from "../ui/help/controller.js";
import { bindKeyboard } from "../input/keyboard.js";
import { bindTouch } from "../input/touch.js";
import { bindVisibility } from "../input/visibility.js";
import { createLoop } from "./loop.js";

export function createApplication({
  random = Math.random,
  requestFrame = requestAnimationFrame,
} = {}) {
  const get = (id) => document.getElementById(id);
  const arena = document.querySelector(".arena");
  const game = new Runner(random),
    scene = new Scene(get("scene"));
  const records = createRecords(),
    sound = createAudio(get),
    events = createEvents();
  const session = {
    difficulty: DEFAULT_DIFFICULTY,
    best: records.read(DEFAULT_DIFFICULTY),
    previousBest: 0,
    lastStatus: "ready",
  };
  const context = { get, arena, game, session, records, sound, events };
  const sync = () => syncState(context),
    refresh = () => updateHud(get, game);
  const loop = createLoop({
    game,
    scene,
    session,
    sync,
    updateHud: refresh,
    requestFrame,
  });

  function start() {
    arena.classList.toggle("impact", false);
    session.previousBest = session.best;
    game.start(session.difficulty);
    loop.reset();
    sync();
    sound.play("start");
    refresh();
    get("start").blur();
    get("restart").blur();
  }
  function jump() {
    if (game.jump()) sound.play(game.jumps === 2 ? "doubleJump" : "jump");
  }
  function slide(held = false) {
    if (game.slide(held)) sound.play("slide");
  }
  function turn(direction) {
    const accepted = game.turn(direction);
    if (accepted) sound.play("turn");
    if (game.status !== session.lastStatus) sync();
    return accepted;
  }
  function togglePause() {
    if (game.status === "running") game.pause();
    else if (game.status === "paused") game.resume();
    sync();
  }
  const controls = { ...context, sync, start, jump, slide, turn, togglePause };
  const buttons = {
    start,
    restart: start,
    resume: togglePause,
    pause: togglePause,
    sound: sound.toggle,
  };
  for (const [id, action] of Object.entries(buttons)) {
    events.on(get(id), "click", action);
  }
  [bindDifficulty, bindHelp, bindKeyboard, bindTouch, bindVisibility].forEach(
    (bind) => bind(controls),
  );
  get("best").textContent = formatScore(session.best);
  sync();
  loop.start();
  return {
    game,
    scene,
    start,
    jump,
    slide,
    turn,
    togglePause,
    destroy() {
      loop.stop();
      events.destroy();
      scene.resizeObserver.disconnect?.();
    },
  };
}
