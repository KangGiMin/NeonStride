import { readFile } from "node:fs/promises";
import {
  DIFFICULTIES,
  DEFAULT_DIFFICULTY,
} from "../../src/config/difficulties.js";
import { within } from "./paths.mjs";

export async function renderHTML(root, name = "index.html", parents = []) {
  if (parents.includes(name)) throw new Error(`Circular HTML include: ${name}`);
  let source = await readFile(within(root, name), "utf8");
  for (const match of [...source.matchAll(/<!-- include: ([\w./-]+) -->/g)]) {
    const fragment = await renderHTML(root, match[1], [...parents, name]);
    source = source.replace(match[0], fragment.trimEnd());
  }
  const options = Object.entries(DIFFICULTIES)
    .map(
      ([id, config]) =>
        `<button id="difficulty-${id}" class="difficulty-option" aria-pressed="${id === DEFAULT_DIFFICULTY}">${config.label}</button>`,
    )
    .join("\n");
  return source
    .replace("{{difficulty-options}}", options)
    .replace(
      "{{difficulty-description}}",
      DIFFICULTIES[DEFAULT_DIFFICULTY].description,
    );
}
