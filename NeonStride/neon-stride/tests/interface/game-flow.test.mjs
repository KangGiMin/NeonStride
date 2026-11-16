import test from "node:test";
import assert from "node:assert/strict";
import { createAppHost } from "../fixtures/application.js";

test("start, scoring, pause, help, keyboard, touch, game-over score and restart are wired", async () => {
  const { elements, arena, docEvents, windowEvents, storage, frame } =
    await createAppHost();
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
