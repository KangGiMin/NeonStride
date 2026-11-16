export function bindHelp({ get, game, sync, events }) {
  const dialog = get("helpDialog");
  events.on(get("help"), "click", () => {
    if (game.status === "running") {
      game.pause();
      sync();
    }
    dialog.showModal();
  });
  events.on(get("closeHelp"), "click", () => dialog.close());
  events.on(dialog, "click", (event) => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      dialog.close();
  });
}
