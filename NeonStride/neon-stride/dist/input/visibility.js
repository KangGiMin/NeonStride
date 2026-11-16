export function bindVisibility({ game, sync, events }) {
  const pause = () => {
    if (game.status === "running") {
      game.pause();
      sync();
    }
  };
  events.on(document, "visibilitychange", () => {
    if (document.hidden) pause();
  });
  events.on(window, "blur", () => {
    game.slideHeld = false;
    pause();
  });
}
