import test from "node:test";
import assert from "node:assert/strict";
import { createAppHost } from "../fixtures/application.js";

test("fall UI hides the result until the descent finishes, blocks rescue input and freezes the score", async () => {
  const { elements, arena, docEvents, frame } = await createAppHost({
    random: () => 0.9375,
  });
  const frameTimeForTest = 1000;
  frame(1000);
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
