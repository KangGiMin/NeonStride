import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("HTML has unique element IDs, valid local assets and a single document", async () => {
  const html = await readFile(
    new URL("../../dist/index.html", import.meta.url),
    "utf8",
  );
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, "duplicate HTML id");
  assert.equal((html.match(/<\/html>/g) || []).length, 1);
  assert.equal(
    html.includes('id="cue"'),
    false,
    "no key prompts in the game scene",
  );
  for (const match of html.matchAll(/(?:src|href)="\.\/([^"#]+)"/g))
    await readFile(new URL("../../dist/" + match[1], import.meta.url));
});
