import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Runner, OBSTACLES, DIFFICULTIES, RULES } from "../dist/engine.js";

test("HTML has unique element IDs, valid local assets and a single document", async () => {
  const html = await readFile(
    new URL("../dist/index.html", import.meta.url),
    "utf8",
  );
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, "duplicate HTML id");
  assert.equal((html.match(/<\/html>/g) || []).length, 1);
  assert.equal(
    html.includes('id="cue"'),
    false,
    "no key prompts in the game scene",
  );
  for (const match of html.matchAll(/(?:src|href)="\.\/([^"#]+)"/g))
    await readFile(new URL("../dist/" + match[1], import.meta.url));
});

// Exercise the actual renderer and input handlers with a minimal DOM/Canvas host.
// This catches missing elements, startup errors and invalid drawing coordinates;
// it does not replace visual QA in a browser.
const gradient = { addColorStop() {} };
let drawCount = 0,
  clipCount = 0,
  lastClipRect;
const context = new Proxy(
  {
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    measureText: (text) => ({ width: text.length * 6 }),
    clip: () => clipCount++,
    rect: (...args) => (lastClipRect = args),
  },
  {
    get(target, key) {
      return key in target
        ? target[key]
        : (...args) => {
            drawCount++;
            for (const arg of args)
              if (typeof arg === "number")
                assert.ok(
                  Number.isFinite(arg),
                  `${String(key)} received invalid coordinate`,
                );
          };
    },
    set(target, key, value) {
      if (key === "globalAlpha")
        assert.ok(
          Number.isFinite(value) && value >= 0 && value <= 1,
          "drawing opacity must be valid",
        );
      target[key] = value;
      return true;
    },
  },
);
class Element {
  constructor() {
    this.handlers = {};
    this.hidden = false;
    this.textContent = "";
    this.style = {};
    this.children = [];
    this.classes = new Set();
    this.classList = {
      toggle: (c, on) => (on ? this.classes.add(c) : this.classes.delete(c)),
    };
  }
  addEventListener(name, fn) {
    this.handlers[name] = fn;
  }
  setAttribute(name, value) {
    this[name] = value;
  }
  blur() {}
  showModal() {
    this.open = true;
  }
  close() {
    this.open = false;
  }
  getBoundingClientRect() {
    return {
      width: 1280,
      height: 640,
      left: 0,
      right: 1280,
      top: 0,
      bottom: 640,
    };
  }
  getContext() {
    return context;
  }
  fire(name, event = {}) {
    this.handlers[name]?.({
      preventDefault() {},
      stopPropagation() {},
      ...event,
    });
  }
}
const html = await readFile(
  new URL("../dist/index.html", import.meta.url),
  "utf8",
);
const elements = new Map(
  [...html.matchAll(/id="([^"]+)"/g)].map((m) => [m[1], new Element()]),
);
elements.get("speedBars").children = Array.from(
  { length: 10 },
  () => new Element(),
);
elements.get("jumpIndicator").children = Array.from(
  { length: 2 },
  () => new Element(),
);
const arena = new Element(),
  docEvents = {},
  windowEvents = {},
  storage = new Map();
let frame;
let obstacleRandom = 0;
globalThis.document = {
  hidden: false,
  getElementById: (id) => {
    assert.ok(elements.has(id), `missing #${id}`);
    return elements.get(id);
  },
  querySelector: () => arena,
  addEventListener: (name, fn) => (docEvents[name] = fn),
};
globalThis.window = {
  addEventListener: (name, fn) => (windowEvents[name] = fn),
};
globalThis.localStorage = {
  getItem: (k) => storage.get(k),
  setItem: (k, v) => storage.set(k, v),
};
globalThis.devicePixelRatio = 1;
globalThis.matchMedia = () => ({ matches: false });
globalThis.ResizeObserver = class {
  observe() {}
};
globalThis.requestAnimationFrame = (fn) => (frame = fn);

test("renderer draws desktop, mobile, jumps, slide, all obstacles, pause and game over", async () => {
  const { Scene } = await import("../dist/renderer.js");
  const canvas = new Element();
  const scene = new Scene(canvas);
  const game = new Runner(() => 0.5);
  for (const size of [
    [1280, 640],
    [375, 580],
  ]) {
    canvas.getBoundingClientRect = () => ({ width: size[0], height: size[1] });
    scene.resize();
    scene.render(game, 1);
    game.start();
    for (const [i, type] of Object.keys(OBSTACLES).entries())
      game.obstacles[i] = {
        type,
        position: game.distance + 8 + i * 15,
        length: type === "gap" || type === "collapse" ? 12 : 1.25,
        variant: 2,
        id: i,
      };
    scene.render(game, 2);
    game.jump();
    game.update(0.2);
    scene.render(game, 2.2);
    game.jump();
    game.update(0.2);
    scene.render(game, 2.4);
    game.y = 0;
    game.vy = 0;
    game.slide();
    scene.render(game, 3);
    game.pause();
    scene.render(game, 3);
    game.end("gap");
    scene.render(game, 3);
  }
  assert.ok(drawCount > 10000);
});
test("all animated hazards render through emergence, falling, impact and clearance in every mode", async () => {
  const { Scene } = await import("../dist/renderer.js");
  const scene = new Scene(new Element()),
    g = new Runner(() => 0.5);
  for (const difficulty of Object.keys(DIFFICULTIES)) {
    g.start(difficulty);
    for (const type of ["monster", "trees", "collapse", "fire"])
      for (const progress of [0, 0.25, 0.6, 0.75, 1]) {
        g.obstacles = [
          {
            type,
            position:
              g.distance + g.speed * g.config.eventLead * (1 - progress),
            length: type === "collapse" ? g.speed * 0.8 : 2.2,
            variant: 2,
            id: 3,
          },
        ];
        scene.render(g, 2 + progress);
      }
  }
});
test("run-to-jump poses blend smoothly, freeze when paused, and reset for sliding or a new run", async () => {
  const { Scene } = await import("../dist/renderer.js"),
    scene = new Scene(new Element()),
    g = new Runner(() => 0);
  g.start();
  scene.character(g, 1, false);
  assert.equal(scene.airBlend, 0);
  g.jump();
  g.update(0.1);
  scene.character(g, 1 + 1 / 60, false);
  assert.ok(scene.airBlend > 0 && scene.airBlend < 1);
  scene.character(g, 1.1, false);
  const inAir = scene.airBlend;
  g.pause();
  scene.character(g, 1.1, false);
  assert.equal(scene.airBlend, inAir);
  g.resume();
  g.y = 0;
  g.vy = 0;
  g.jumps = 0;
  scene.character(g, 1.1 + 1 / 60, false);
  assert.ok(
    scene.airBlend > 0 && scene.airBlend < inAir,
    "landing eases back into the stride",
  );
  g.slide();
  scene.character(g, 1.2, false);
  assert.equal(scene.airBlend, 0);
  g.start();
  scene.character(g, 0, false);
  assert.equal(scene.airBlend, 0);
});
test("start, scoring, pause, help, keyboard, touch, game-over score and restart are wired", async () => {
  const originalRandom = Math.random;
  // Keep this input/UI scenario reproducible; random generation is tested separately.
  try {
    Math.random = () => obstacleRandom;
    await import("../dist/app.js");
  } finally {
    Math.random = originalRandom;
  }
  frame(1000);
  elements.get("start").fire("click");
  assert.ok(arena.classes.has("playing"));
  frame(2000);
  assert.equal(elements.get("score").textContent, "000010");
  elements.get("pause").fire("click");
  frame(7000);
  assert.equal(elements.get("score").textContent, "000010");
  assert.equal(elements.get("paused").hidden, false);
  elements.get("resume").fire("click");
  frame(8000);
  assert.equal(elements.get("score").textContent, "000020");
  elements.get("help").fire("click");
  assert.equal(elements.get("helpDialog").open, true);
  assert.equal(elements.get("paused").hidden, false);
  elements.get("closeHelp").fire("click");
  assert.equal(elements.get("helpDialog").open, false);
  elements.get("resume").fire("click");
  frame(10000);
  assert.ok(arena.classes.has("over"));
  const final = Number(elements.get("finalScore").textContent);
  assert.ok(final >= 30 && final < 40);
  assert.equal(elements.get("result").hidden, false);
  assert.ok(
    arena.classes.has("impact"),
    "obstacle collision triggers screen impact",
  );
  frame(15000);
  assert.equal(Number(elements.get("finalScore").textContent), final);
  assert.equal(Number(storage.get("neon-stride-best:easy")), final);
  elements.get("restart").fire("click");
  frame(15010);
  assert.equal(elements.get("score").textContent, "000000");
  assert.ok(arena.classes.has("playing"));
  assert.equal(
    arena.classes.has("impact"),
    false,
    "restart clears the previous impact",
  );
  docEvents.keydown({ code: "Space", repeat: false, preventDefault() {} });
  frame(15100);
  assert.ok(elements.get("jumpIndicator").children[0].classes.has("used"));
  elements.get("touchJump").fire("pointerdown");
  frame(15200);
  assert.ok(elements.get("jumpIndicator").children[1].classes.has("used"));
  docEvents.keydown({ code: "ArrowDown", repeat: false, preventDefault() {} });
  frame(15250);
  assert.ok(
    elements
      .get("jumpIndicator")
      .children.every((dot) => !dot.classes.has("used")),
    "down arrow cancels the double jump",
  );
  docEvents.keyup({ code: "ArrowDown" });
  elements.get("touchJump").fire("pointerdown");
  frame(15300);
  assert.ok(elements.get("jumpIndicator").children[0].classes.has("used"));
  elements.get("touchSlide").fire("pointerdown");
  frame(15350);
  assert.ok(
    elements
      .get("jumpIndicator")
      .children.every((dot) => !dot.classes.has("used")),
    "touch slide cancels the jump",
  );
  windowEvents.blur();
  assert.equal(elements.get("paused").hidden, false);
});
test("difficulty selection changes actual run speed, is locked during a run, and keeps records separate", () => {
  elements.get("resume").fire("click");
  frame(20000);
  assert.ok(arena.classes.has("over"));
  for (const [id, config] of Object.entries(DIFFICULTIES)) {
    elements.get("difficulty-" + id).fire("click");
    assert.equal(elements.get("difficulty-" + id)["aria-pressed"], "true");
    assert.equal(
      elements.get("difficultyDetail").textContent,
      config.description,
    );
    elements.get("restart").fire("click");
    assert.equal(
      elements.get("speed").textContent,
      (config.initialSpeed / 14).toFixed(2),
    );
    assert.ok(elements.get("difficulty-extreme").disabled);
    elements
      .get("difficulty-" + (id === "easy" ? "extreme" : "easy"))
      .fire("click");
    assert.equal(elements.get("difficulty-" + id)["aria-pressed"], "true");
    frame((frameTimeForTest += 5000));
    assert.ok(arena.classes.has("over"));
    assert.ok(Number(storage.get("neon-stride-best:" + id)) > 0);
  }
});
let frameTimeForTest = 20000;

test("falling runner is clipped by the near ledge and disappears at the end of the descent", async () => {
  const { Scene } = await import("../dist/renderer.js");
  const scene = new Scene(new Element()),
    g = new Runner(() => 0);
  g.start();
  g.obstacles = [{ type: "gap", position: -0.1, length: 12, id: 0 }];
  g.end("gap");
  const oldClips = clipCount;
  scene.render(g, 0);
  assert.ok(clipCount > oldClips);
  const edge = scene.project(0, 0, -0.1).y;
  assert.ok(Math.abs(lastClipRect[3] - edge) < 1e-8);
  for (const step of [0.15, 0.2, 0.25]) {
    g.update(step);
    scene.render(g, g.fallTime);
  }
  g.update(1);
  assert.equal(g.status, "over");
  const count = drawCount;
  scene.character(g, 2, false);
  assert.equal(
    drawCount,
    count,
    "completed fall leaves no runner above the road",
  );
});

test("fall UI hides the result until the descent finishes, blocks rescue input and freezes the score", () => {
  obstacleRandom = 0.9375;
  elements.get("difficulty-easy").fire("click");
  elements.get("restart").fire("click");
  let stamp = frameTimeForTest + 3450;
  frame(stamp);
  assert.ok(arena.classes.has("falling"));
  assert.equal(elements.get("result").hidden, true);
  assert.equal(elements.get("overlay").hidden, true);
  assert.ok(elements.get("difficulty-hard").disabled);
  const frozen = Number(elements.get("score").textContent);
  docEvents.keydown({ code: "Space", repeat: false, preventDefault() {} });
  elements.get("touchJump").fire("pointerdown");
  elements.get("touchSlide").fire("pointerdown");
  frame((stamp += 200));
  assert.ok(arena.classes.has("falling"));
  assert.equal(Number(elements.get("score").textContent), frozen);
  assert.equal(elements.get("result").hidden, true);
  frame((stamp += 1000));
  assert.ok(arena.classes.has("over"));
  assert.equal(elements.get("result").hidden, false);
  assert.equal(Number(elements.get("finalScore").textContent), frozen);
  assert.equal(arena.classes.has("impact"), false);
  elements.get("restart").fire("click");
  assert.equal(elements.get("score").textContent, "000000");
  assert.ok(arena.classes.has("playing"));
});
