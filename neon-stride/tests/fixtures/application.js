import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createCanvasHost } from "./canvas.js";
import { createApplication } from "../../src/application/create-app.js";

export async function createAppHost({ random = () => 0 } = {}) {
  const canvas = createCanvasHost(),
    { Element } = canvas;
  const html = await readFile(
    new URL("../../dist/index.html", import.meta.url),
    "utf8",
  );
  const elements = new Map(
    [...html.matchAll(/id="([^"]+)"/g)].map((match) => [
      match[1],
      new Element(),
    ]),
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
  let callback;
  const target = (handlers) => ({
    addEventListener: (name, fn) => {
      handlers[name] = fn;
    },
    removeEventListener: (name, fn) => {
      if (handlers[name] === fn) delete handlers[name];
    },
  });
  globalThis.document = {
    hidden: false,
    ...target(docEvents),
    querySelector: () => arena,
    getElementById: (id) => {
      assert.ok(elements.has(id), `missing #${id}`);
      return elements.get(id);
    },
  };
  globalThis.window = target(windowEvents);
  globalThis.localStorage = {
    getItem: (key) => storage.get(key),
    setItem: (key, value) => storage.set(key, value),
  };
  const app = createApplication({
    random,
    requestFrame: (fn) => {
      callback = fn;
    },
  });
  return {
    app,
    canvas,
    elements,
    arena,
    docEvents,
    windowEvents,
    storage,
    frame: (time) => callback(time),
  };
}
