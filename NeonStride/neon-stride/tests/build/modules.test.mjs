import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { runInNewContext } from "node:vm";
import { bundleModules } from "../../scripts/lib/modules.mjs";

test("standalone preserves shared dependencies, aliases, multiline imports and local names", async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), "neon-module-test-"));
  t.after(async () => {
    assert.equal(path.dirname(directory), path.resolve(tmpdir()));
    await rm(directory, { recursive: true, force: true });
  });
  const files = {
    "shared.js":
      "globalThis.loads = (globalThis.loads || 0) + 1;\nexport const value = 7;",
    "first.js":
      "import { value } from './shared.js';\nconst local = 3;\nexport function total() { return value + local; }",
    "second.js":
      "import { value } from './shared.js';\nconst local = 5;\nexport const total = value + local;",
    "public.js":
      "export { total as first } from './first.js';\nexport { total as second } from './second.js';",
    "entry.js":
      "import {\n first as left,\n second\n} from './public.js';\nimport * as common from './shared.js';\nglobalThis.result = [left(), second, common.value];",
  };
  for (const [name, source] of Object.entries(files))
    await writeFile(path.join(directory, name), source);
  const context = {};
  runInNewContext(await bundleModules(directory, "entry.js"), context);
  assert.deepEqual(Array.from(context.result), [10, 12, 7]);
  assert.equal(context.loads, 1);
  await writeFile(
    path.join(directory, "entry.js"),
    "import { value } from './entry.js';",
  );
  await assert.rejects(bundleModules(directory, "entry.js"), /Circular module/);
});
