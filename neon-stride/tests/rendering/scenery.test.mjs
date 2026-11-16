import test from "node:test";
import assert from "node:assert/strict";
import { Runner, DIFFICULTIES, OBSTACLES } from "../../src/engine.js";
import { createCanvasHost } from "../fixtures/canvas.js";

test("renderer draws desktop, mobile, jumps, slide, all obstacles, pause and game over", async () => {
  const canvasHost = createCanvasHost(),
    { Element } = canvasHost;
  const { Scene } = await import("../../src/renderer.js");
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
  assert.ok(canvasHost.drawCount > 10000);
});

test("all animated hazards render through emergence, falling, impact and clearance in every mode", async () => {
  const canvasHost = createCanvasHost(),
    { Element } = canvasHost;
  const { Scene } = await import("../../src/renderer.js");
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
