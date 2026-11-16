import { readFile } from "node:fs/promises";
import path from "node:path";
import { Script } from "node:vm";
import { within } from "./paths.mjs";

// Static named/namespace imports and named exports are the project's module contract.
// Isolated factories prevent component-local names from colliding in the HTML build.
const imports =
  /^import\s+([\s\S]*?)\s+from\s+(['"])([^'"]+)\2\s*;[ \t]*(?:\r?\n)?/gm;
const reexports =
  /^export\s*\{([^}]+)\}\s*from\s*(['"])([^'"]+)\2\s*;[ \t]*(?:\r?\n)?/gm;
const names = (list) =>
  list
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.split(/\s+as\s+/));
const key = (filename) => filename.split(path.sep).join("/");
export async function bundleModules(root, entry = "app.js") {
  const modules = new Map(),
    visiting = new Set();
  async function visit(name) {
    const id = key(name);
    if (modules.has(id)) return;
    if (visiting.has(id)) throw new Error(`Circular module dependency: ${id}`);
    visiting.add(id);
    let source = await readFile(within(root, name), "utf8");
    const exports = [];
    const resolve = (relative) => {
      if (!relative.startsWith("."))
        throw new Error(`External module is not supported: ${relative}`);
      return key(path.join(path.dirname(name), relative));
    };
    for (const match of [
      ...source.matchAll(imports),
      ...source.matchAll(reexports),
    ])
      await visit(resolve(match[3]));
    source = source.replace(reexports, (_, list, quote, relative) => {
      for (const [original, alias = original] of names(list))
        exports.push(
          `${alias}: __modules[${JSON.stringify(resolve(relative))}].${original}`,
        );
      return "";
    });
    source = source.replace(imports, (_, bindings, quote, relative) => {
      const dependency = `__modules[${JSON.stringify(resolve(relative))}]`;
      if (bindings.startsWith("{"))
        return `const { ${names(bindings.slice(1, -1))
          .map(([name, alias = name]) => `${name}: ${alias}`)
          .join(", ")} } = ${dependency};\n`;
      const namespace = bindings.match(/^\*\s+as\s+(\w+)$/);
      if (namespace) return `const ${namespace[1]} = ${dependency};\n`;
      throw new Error(`Unsupported import in ${id}: ${bindings}`);
    });
    source = source
      .replace(
        /^export\s+(const|function|class)\s+(\w+)/gm,
        (_, type, name) => {
          exports.push(name);
          return `${type} ${name}`;
        },
      )
      .replace(/^export\s*\{([^}]+)\}\s*;/gm, (_, list) => {
        exports.push(
          ...names(list).map(([name, alias = name]) => `${alias}: ${name}`),
        );
        return "";
      });
    if (/^(?:import|export)\s/m.test(source))
      throw new Error(`Unsupported module syntax in ${id}`);
    modules.set(id, `${source}\nreturn { ${exports.join(", ")} };`);
    visiting.delete(id);
  }
  await visit(entry);
  const factories = [...modules]
    .map(
      ([id, source]) =>
        `__modules[${JSON.stringify(id)}] = (() => {\n${source}\n})();`,
    )
    .join("\n");
  const script = `(() => {\nconst __modules = Object.create(null);\n${factories}\n})();`;
  new Script(script);
  return script;
}
