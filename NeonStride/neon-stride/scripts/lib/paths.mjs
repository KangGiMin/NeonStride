import path from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
export const sourceRoot = path.join(projectRoot, "src");
export const outputRoot = path.join(projectRoot, "dist");
export function within(root, relative) {
  const filename = path.resolve(root, relative);
  if (!filename.startsWith(path.resolve(root) + path.sep))
    throw new Error(`Path outside root: ${relative}`);
  return filename;
}
