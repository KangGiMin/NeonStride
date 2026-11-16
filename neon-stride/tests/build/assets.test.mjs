import test from "node:test";
import assert from "node:assert/strict";
import { sourceRoot } from "../../scripts/lib/paths.mjs";
import { renderHTML } from "../../scripts/lib/templates.mjs";
import { inlineStyles } from "../../scripts/lib/styles.mjs";
import { DIFFICULTIES } from "../../src/config/difficulties.js";

test("HTML components use the same difficulty definitions as the game", async () => {
  const html = await renderHTML(sourceRoot);
  assert.doesNotMatch(html, /<!-- include:|\{\{difficulty-/);
  for (const [id, config] of Object.entries(DIFFICULTIES)) {
    assert.match(
      html,
      new RegExp(`id="difficulty-${id}"[^>]*>${config.label}</button>`),
    );
  }
  assert.match(html, /aria-pressed="true">쉬움<\/button>/);
});

test("standalone CSS resolves all local component imports and preserves the font import", async () => {
  const css = await inlineStyles(sourceRoot);
  assert.doesNotMatch(css, /@import\s+url\(['"]\./);
  assert.match(css, /fonts\.googleapis\.com/);
  for (const selector of [
    ".arena",
    ".playing .touch-controls",
    ".arena.impact #scene",
  ])
    assert.ok(css.includes(selector));
});
