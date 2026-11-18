import test from "node:test";
import assert from "node:assert/strict";
import { createAppHost } from "../fixtures/application.js";
import { makeCorner } from "../../src/game/navigation/route.js";

test("arrow keys steer while Shift plus an arrow queues a corner without lateral movement", async () => {
  const h = await createAppHost();
  h.app.start();
  h.frame(1000);
  const key = (code, shiftKey = false) =>
    h.docEvents.keydown({ code, shiftKey, preventDefault() {} });
  key("ArrowRight");
  h.frame(1200);
  assert.ok(h.app.game.x > 1);
  h.docEvents.keyup({ code: "ArrowRight" });
  const x = h.app.game.x;
  h.frame(1300);
  assert.equal(h.app.game.x, x);
  h.app.game.obstacles = [];
  h.app.game.nextPosition = 1e9;
  h.app.game.corners = [
    makeCorner(null, h.app.game.distance + h.app.game.speed * 0.4, -1),
  ];
  h.app.game.nextCorner = 1e9;
  key("ArrowLeft", true);
  assert.equal(h.app.game.steer, 0);
  h.frame(1800);
  assert.equal(h.app.game.turnsCompleted, 1);
  assert.equal(h.app.game.x, x);
  assert.equal(h.app.game.heading, -Math.PI / 2);
  h.app.destroy();
});

test("wrong corner input synchronizes game over immediately", async () => {
  const h = await createAppHost();
  h.app.start();
  h.app.game.corners = [makeCorner(null, h.app.game.speed * 0.4, 1)];
  h.docEvents.keydown({
    code: "ArrowLeft",
    shiftKey: true,
    preventDefault() {},
  });
  assert.ok(h.arena.classes.has("over"));
  assert.equal(h.elements.get("result").hidden, false);
  h.app.destroy();
});

test("focused buttons retain their Space behavior instead of starting or resuming the game", async () => {
  const h = await createAppHost();
  h.app.start();
  h.app.togglePause();
  let prevented = false;
  h.docEvents.keydown({
    code: "Space",
    target: { closest: () => true },
    preventDefault() {
      prevented = true;
    },
  });
  assert.equal(h.app.game.status, "paused");
  assert.equal(prevented, false);
  h.app.destroy();
});

test("touch navigation stops on cancellation and turns during the corner window", async () => {
  const h = await createAppHost();
  h.app.start();
  h.frame(1000);
  h.elements.get("touchLeft").fire("pointerdown");
  h.frame(1200);
  assert.ok(h.app.game.x < 0);
  h.elements.get("touchLeft").fire("pointercancel");
  assert.equal(h.app.game.steer, 0);
  h.app.game.corners = [
    makeCorner(null, h.app.game.distance + h.app.game.speed * 0.4, 1),
  ];
  h.elements.get("touchRight").fire("pointerdown");
  assert.equal(h.app.game.corners[0].queued, true);
  h.app.destroy();
});
