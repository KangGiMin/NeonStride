import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildProject } from "./scripts/build.mjs";
import { projectRoot, outputRoot } from "./scripts/lib/paths.mjs";
import { inlineStyles } from "./scripts/lib/styles.mjs";
import { bundleModules } from "./scripts/lib/modules.mjs";
import { formatHTML } from "./scripts/lib/format.mjs";

await buildProject();
const [html, css, icon, script] = await Promise.all([
  readFile(path.join(outputRoot, "index.html"), "utf8"),
  inlineStyles(outputRoot),
  readFile(path.join(outputRoot, "icon.svg"), "utf8"),
  bundleModules(outputRoot),
]);
const output = html
  .replace(
    /<link rel="icon"[^>]+>/,
    `<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(icon)}">`,
  )
  .replace(
    /<link rel="stylesheet" href="\.\/style.css"\s*\/?>/,
    `<style>${css}</style>`,
  )
  .replace(
    /<script type="module" src="\.\/app.js"><\/script>/,
    `<script>${script}</script>`,
  );
if (/<script[^>]*\bsrc=/.test(output) || output.includes('href="./style.css"'))
  throw new Error("Standalone asset replacement failed");
await writeFile(
  path.join(projectRoot, "NEON-STRIDE.html"),
  await formatHTML(output),
  "utf8",
);
console.log("Standalone ready: NEON-STRIDE.html");
