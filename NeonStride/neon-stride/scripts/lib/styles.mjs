import { readFile } from "node:fs/promises";
import path from "node:path";
import { within } from "./paths.mjs";

export async function inlineStyles(root, name = "style.css", parents = []) {
  if (parents.includes(name))
    throw new Error(`Circular stylesheet import: ${name}`);
  let source = await readFile(within(root, name), "utf8");
  for (const match of [
    ...source.matchAll(/@import\s+url\(['"](\.[^'"]+)['"]\);/g),
  ]) {
    const dependency = path.join(path.dirname(name), match[1]);
    source = source.replace(
      match[0],
      await inlineStyles(root, dependency, [...parents, name]),
    );
  }
  return source;
}
