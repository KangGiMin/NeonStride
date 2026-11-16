import { format, resolveConfig } from "prettier";
import path from "node:path";
import { sourceRoot } from "./paths.mjs";

const options = await resolveConfig(path.join(sourceRoot, "index.html"));

export function formatHTML(source) {
  return format(source, { ...options, parser: "html" });
}
