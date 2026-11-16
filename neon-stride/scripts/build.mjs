import { readdir, mkdir, copyFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot, sourceRoot, outputRoot } from "./lib/paths.mjs";
import { renderHTML } from "./lib/templates.mjs";
import { formatHTML } from "./lib/format.mjs";
import {
  addSearchMetadata,
  readSiteConfig,
  writeSearchFiles,
} from "./lib/search.mjs";

async function copyAssets(source, output) {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name),
      to = path.join(output, entry.name);
    if (entry.isDirectory()) await copyAssets(from, to);
    else if (path.extname(entry.name) !== ".html") {
      await mkdir(path.dirname(to), { recursive: true });
      await copyFile(from, to);
    }
  }
}

export async function buildProject() {
  const site = await readSiteConfig(sourceRoot);
  const html = await formatHTML(
    addSearchMetadata(await renderHTML(sourceRoot), site),
  );
  // Clean only this project's explicitly named output directory.
  if (
    path.dirname(outputRoot) !== path.resolve(projectRoot) ||
    path.basename(outputRoot) !== "dist"
  )
    throw new Error("Invalid build output");
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });
  await copyAssets(sourceRoot, outputRoot);
  await writeFile(path.join(outputRoot, "index.html"), html, "utf8");
  await writeSearchFiles(outputRoot, site);
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  await buildProject();
  console.log("Built src/ → dist/");
}
