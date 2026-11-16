import test from "node:test";
import assert from "node:assert/strict";
import { createAppHost } from "../fixtures/application.js";
import { DIFFICULTIES } from "../../src/config/difficulties.js";

test("difficulty selection changes actual run speed, is locked during a run, and keeps records separate", async () => {
  const { elements, arena, docEvents, windowEvents, storage, frame } =
    await createAppHost();
  elements.get("start").fire("click");
  frame(1000);
  frame(6000);
  let frameTimeForTest = 6000;
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
