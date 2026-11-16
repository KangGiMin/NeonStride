import { Runner, RULES, DIFFICULTIES, isPit } from "./engine.js";
import { Scene } from "./renderer.js";
const $ = (id) => document.getElementById(id);
const game = new Runner();
const scene = new Scene($("scene"));
const arena = document.querySelector(".arena");
let selectedDifficulty = 'easy';
const recordKey = difficulty => `neon-stride-best:${difficulty}`;
function readBest(difficulty) {
  try { return Math.max(0, Number(localStorage.getItem(recordKey(difficulty)) ?? (difficulty === 'easy' ? localStorage.getItem('neon-stride-best') : 0)) || 0); } catch { return 0; }
}
let best = readBest(selectedDifficulty),
  previousBest = 0,
  soundEnabled = false,
  audio,
  lastStatus = "ready",
  animationTime = 0,
  frameTime = 0,
  lastDraw = 0;
$("best").textContent = String(best).padStart(6, "0");
function tone(freq, duration = 0.15, type = "sine", volume = 0.05) {
  if (!soundEnabled) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    const oscillator = audio.createOscillator(),
      gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      freq * 0.55,
      audio.currentTime + duration,
    );
    gain.gain.setValueAtTime(volume, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  } catch {}
}
function start() {
  arena.classList.toggle("impact", false);
  previousBest = best;
  game.start(selectedDifficulty);
  animationTime = 0;
  syncState();
  tone(550, 0.16, "triangle");
  updateHud();
  $("start").blur();
  $("restart").blur();
}
function jump() {
  if (game.jump()) tone(game.jumps === 2 ? 800 : 520, 0.15, "triangle");
}
function slide(held = false) {
  if (game.slide(held)) tone(180, 0.13, "sawtooth", 0.025);
}
function togglePause() {
  if (game.status === "running") game.pause();
  else if (game.status === "paused") game.resume();
  syncState();
}
function showGameOver() {
  arena.classList.toggle("impact", !isPit(game.reason));
  $("finalScore").textContent = game.score.toLocaleString("ko-KR");
  $("finalTime").textContent =
    `${Math.floor(game.elapsed / 60)}:${String(Math.floor(game.elapsed % 60)).padStart(2, "0")}`;
  $("finalDistance").textContent =
    `${Math.floor(game.distance).toLocaleString("ko-KR")} m`;
  $("finalCleared").textContent = game.cleared;
  $("reason").textContent = {
    low: "방벽에 부딪혔습니다. 점프로 뛰어넘으세요.",
    high: "높은 방벽입니다. 공중에서 한 번 더 점프하세요.",
    bar: "낮게 숙이세요. 슬라이딩으로 통과할 수 있습니다.",
    gap: "도로가 끊겼습니다. 2단 점프로 건너세요.",
    monster: '괴물의 방망이에 맞았습니다. 몸을 낮춰 스윙을 피하세요.',
    trees: '쓰러진 나무에 부딪혔습니다. 나무 더미를 뛰어넘으세요.',
    collapse: '철골이 도로를 무너뜨렸습니다. 2단 점프로 건너세요.',
    fire: '가로 불기둥에 닿았습니다. 슬라이딩으로 아래를 통과하세요.',
  }[game.reason];
  $("newBest").hidden = !(game.score > previousBest);
  if (game.score > best) {
    best = game.score;
    $("best").textContent = String(best).padStart(6, "0");
    try {
      localStorage.setItem(recordKey(game.difficulty), String(best));
    } catch {}
  }
  tone(120, 0.45, "sawtooth", 0.055);
}
function syncState() {
  const state = game.status;
  arena.classList.toggle("playing", state === "running");
  arena.classList.toggle("falling", state === "falling");
  arena.classList.toggle("over", state === "over");
  arena.classList.toggle("paused", state === "paused");
  $("overlay").hidden = state === "running" || state === "falling";
  $("intro").hidden = state !== "ready";
  $("result").hidden = state !== "over";
  $("paused").hidden = state !== "paused";
  $("pause").disabled = !["running", "paused"].includes(state);
  $("pause").textContent = state === "paused" ? "▷" : "Ⅱ";
  $("pause").setAttribute(
    "aria-label",
    state === "paused" ? "계속 달리기" : "일시 정지",
  );
  $("status").textContent = {
    ready: "READY TO CONNECT",
    running: "RUN IN PROGRESS",
    paused: "CONNECTION PAUSED",
    over: "RUN TERMINATED",
    falling: "SIGNAL LOST",
  }[state];
  $("jumpIndicator").hidden = state !== "running";
  if (state === "over" && lastStatus !== "over") showGameOver();
  for (const id of Object.keys(DIFFICULTIES)) $('difficulty-' + id).disabled = state === 'running' || state === 'paused' || state === 'falling';
  lastStatus = state;
}
function updateHud() {
  $("score").textContent = String(game.score).padStart(6, "0");
  $("speed").textContent = (game.speed / RULES.initialSpeed).toFixed(2);
  [...$("speedBars").children].forEach((bar, i) =>
    bar.classList.toggle("on", i < 2 + Math.floor((game.speed - 14) / 2)),
  );
  [...$("jumpIndicator").children].forEach((bar, i) =>
    bar.classList.toggle("used", i < game.jumps),
  );
}
for (const id of Object.keys(DIFFICULTIES)) {
  $('difficulty-' + id).addEventListener('click', () => {
    if (game.status === 'running' || game.status === 'paused' || game.status === 'falling') return;
    selectedDifficulty = id; best = readBest(id);
    $('best').textContent = String(best).padStart(6, '0');
    $('difficultyDetail').textContent = DIFFICULTIES[id].description;
    for (const choice of Object.keys(DIFFICULTIES)) $('difficulty-' + choice).setAttribute('aria-pressed', String(choice === id));
    $('difficulty-' + id).blur();
  });
}
$("start").addEventListener("click", start);
$("restart").addEventListener("click", start);
$("resume").addEventListener("click", togglePause);
$("pause").addEventListener("click", togglePause);
$("sound").addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  $("sound").setAttribute(
    "aria-label",
    soundEnabled ? "효과음 끄기" : "효과음 켜기",
  );
  $("sound").title = soundEnabled ? "효과음 끄기" : "효과음 켜기";
  $("soundIcon").innerHTML = soundEnabled
    ? '<path d="M11 5 6 9H3v6h3l5 4V5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>'
    : '<path d="M11 5 6 9H3v6h3l5 4V5ZM16 9l5 6m0-6-5 6"/>';
  tone(650, 0.1);
});
$("help").addEventListener("click", () => {
  if (game.status === "running") {
    game.pause();
    syncState();
  }
  $("helpDialog").showModal();
});
$("closeHelp").addEventListener("click", () => $("helpDialog").close());
$("helpDialog").addEventListener("click", (event) => {
  if (event.target === $("helpDialog")) {
    const r = $("helpDialog").getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      $("helpDialog").close();
  }
});
document.addEventListener("keydown", (event) => {
  if ($("helpDialog").open) return;
  if (event.code === 'Space' && event.target?.closest?.('.difficulty-option')) return;
  if (
    [
      "Space",
      "ArrowUp",
      "ArrowDown",
      "KeyS",
      "KeyW",
      "KeyP",
      "Escape",
    ].includes(event.code)
  )
    event.preventDefault();
  if (event.repeat) return;
  if (event.code === "KeyP" || event.code === "Escape") {
    togglePause();
    return;
  }
  if (["Space", "ArrowUp", "KeyW"].includes(event.code)) {
    if (game.status === "ready" || game.status === "over") start();
    else if (game.status === "paused") togglePause();
    else jump();
  }
  if (["ArrowDown", "KeyS"].includes(event.code)) slide(true);
});
document.addEventListener("keyup", (event) => {
  if (["ArrowDown", "KeyS"].includes(event.code)) game.slideHeld = false;
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && game.status === "running") {
    game.pause();
    syncState();
  }
});
window.addEventListener("blur", () => {
  game.slideHeld = false;
  if (game.status === "running") {
    game.pause();
    syncState();
  }
});
$("touchJump").addEventListener("pointerdown", (event) => {
  event.preventDefault();
  event.stopPropagation();
  jump();
});
$("touchSlide").addEventListener("pointerdown", (event) => {
  event.preventDefault();
  event.stopPropagation();
  slide();
});
let touchOrigin;
$("scene").addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse") return;
  touchOrigin = { x: event.clientX, y: event.clientY };
});
$("scene").addEventListener("pointerup", (event) => {
  if (!touchOrigin) return;
  const dy = event.clientY - touchOrigin.y;
  touchOrigin = null;
  if (dy > 35) slide();
  else jump();
});
$("scene").addEventListener("pointercancel", () => {
  touchOrigin = null;
});
function animate(timestamp) {
  const dt = frameTime ? Math.max(0, (timestamp - frameTime) / 1000) : 0;
  frameTime = timestamp;
  if (game.status === "running" || game.status === "ready" || game.status === "falling") animationTime += dt;
  if (game.status === "running" || game.status === "falling") {
    game.update(dt);
    if (game.status !== lastStatus) syncState();
  }
  if (timestamp - lastDraw > 33) {
    updateHud();
    lastDraw = timestamp;
  }
  scene.render(game, animationTime);
  requestAnimationFrame(animate);
}
syncState();
requestAnimationFrame(animate);
