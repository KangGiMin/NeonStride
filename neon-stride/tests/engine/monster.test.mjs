import test from "node:test";
import assert from "node:assert/strict";
import { Runner, DIFFICULTIES } from "../../src/engine.js";
import { advance } from "../fixtures/engine.js";

for (const difficulty of Object.keys(DIFFICULTIES)) {
  test(`${difficulty}: monster bat allows sliding or a timed double jump, but not a single jump`, () => {
    for (const maxSpeed of [false, true])
      for (const lead of [0.38, 0.46, 0.6, 0.7]) {
        for (const action of ["single", "double", "slide"]) {
          const game = new Runner(() => 0);
          game.start(difficulty);
          if (maxSpeed) {
            game.elapsed =
              (game.config.maxSpeed - game.config.initialSpeed) /
              game.config.acceleration;
            game.speed = game.config.maxSpeed;
          }
          game.obstacles = [
            {
              type: "monster",
              position: game.speed * lead,
              length: 1.25,
              id: 0,
              passed: false,
            },
          ];
          game.nextPosition = 1e9;
          if (action === "slide") game.slide();
          else {
            game.jump();
            if (action === "double") {
              advance(game, 0.19);
              game.jump();
            }
          }
          advance(game, lead + 0.25);
          const context = `${difficulty}/${maxSpeed ? "maximum" : "initial"}/${lead}/${action}`;
          assert.equal(
            game.status,
            action === "single" ? "over" : "running",
            context,
          );
          if (action === "single")
            assert.equal(game.reason, "monster", context);
          else assert.equal(game.cleared, 1, context);
        }
      }
  });
}
