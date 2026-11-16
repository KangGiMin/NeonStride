import test from "node:test";
import assert from "node:assert/strict";
import { createAppHost } from "../fixtures/application.js";

test("disposing an application releases input handlers and stops queued frames", async () => {
  const host = await createAppHost();
  host.app.start();
  host.frame(1000);
  const elapsed = host.app.game.elapsed;
  host.app.destroy();
  assert.equal(host.docEvents.keydown, undefined);
  assert.equal(host.elements.get("touchJump").handlers.pointerdown, undefined);
  host.frame(2000);
  assert.equal(host.app.game.elapsed, elapsed);
});
