import { readFile, writeFile, mkdtemp, cp, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath, pathToFileURL } from "node:url";
const out = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(out, "../NeonStride/neon-stride");
const { Runner, DIFFICULTIES, obstacleSpec, isPit, RULES } = await import(
  pathToFileURL(path.join(project, "dist/engine.js"))
);
const result = {
  engine: {
    runs: 0,
    virtualSeconds: 0,
    failures: [],
    minCleared: Infinity,
    maxObstacleCount: 0,
  },
  server: [],
  standalone: {},
  preview: {},
  files: [],
};
const start = performance.now();
for (const difficulty of Object.keys(DIFFICULTIES))
  for (let initialSeed = 1; initialSeed <= 100; initialSeed++) {
    let seed = initialSeed;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const game = new Runner(random);
    game.start(difficulty);
    let doubleAt = null;
    for (let tick = 0; tick < 600 * 120; tick++) {
      const next = game.obstacles.find(
        (o) => !o.passed && o.position + o.length > game.distance,
      );
      if (next) {
        const seconds = (next.position - game.distance) / game.speed,
          spec = obstacleSpec(next);
        const lead =
          next.type === "collapse" ? 0.23 : spec.height > 1.35 ? 0.46 : 0.29;
        if (seconds < lead && seconds > 0 && game.jumps === 0) {
          if (spec.kind === "slide") game.slide();
          else {
            game.jump();
            doubleAt =
              isPit(next.type) || spec.height > 1.35
                ? game.elapsed + 0.19
                : null;
          }
        }
      }
      if (doubleAt !== null && game.elapsed >= doubleAt) {
        game.jump();
        doubleAt = null;
      }
      game.update(1 / 120);
      result.engine.maxObstacleCount = Math.max(
        result.engine.maxObstacleCount,
        game.obstacles.length,
      );
      if (game.status !== "running") {
        result.engine.failures.push({
          difficulty,
          seed: initialSeed,
          time: game.elapsed,
          reason: game.reason,
        });
        break;
      }
    }
    result.engine.runs++;
    result.engine.virtualSeconds += game.elapsed;
    result.engine.minCleared = Math.min(result.engine.minCleared, game.cleared);
  }
result.engine.wallMs = performance.now() - start;
result.balance = {
  singleJumpPeak: RULES.jump ** 2 / (2 * RULES.gravity),
  singleJumpAirTime: (2 * RULES.jump) / RULES.gravity,
  difficulties: Object.fromEntries(
    Object.entries(DIFFICULTIES).map(([k, v]) => [
      k,
      {
        ...v,
        secondsToMaxSpeed: (v.maxSpeed - v.initialSpeed) / v.acceleration,
        initialHudLitBars: Math.min(
          10,
          2 + Math.floor((v.initialSpeed - 14) / 2),
        ),
      },
    ]),
  ),
};
const acorn = {};
vm.runInNewContext(
  process.binding("natives")["internal/deps/acorn/acorn/dist/acorn"],
  { exports: acorn, module: { exports: acorn } },
);
const tokens = (source) =>
  [...acorn.tokenizer(source, { ecmaVersion: "latest" })].map((token) => ({
    type: token.type.label,
    value: token.value,
  }));
const html = await readFile(path.join(project, "NEON-STRIDE.html"), "utf8");
const newHTML = await readFile(
  path.join(out, "generated/NEON-STRIDE.html"),
  "utf8",
);
const getScript = (s) =>
  s.match(/<script>\(\(\)=>\{\s*([\s\S]*?)\}\)\(\);<\/script>/)[1];
result.standalone.scriptTokenEquivalent =
  JSON.stringify(tokens(getScript(html))) ===
  JSON.stringify(tokens(getScript(newHTML)));
result.standalone.cssWhitespaceEquivalent =
  html.match(/<style>([\s\S]*?)<\/style>/)[1].replace(/\s/g, "") ===
  newHTML.match(/<style>([\s\S]*?)<\/style>/)[1].replace(/\s/g, "");
const normalizedAST = (source) =>
  JSON.stringify(
    acorn.parse(source, { ecmaVersion: "latest" }),
    (key, value) => (["start", "end", "raw"].includes(key) ? undefined : value),
  );
result.standalone.scriptASTEquivalent =
  normalizedAST(getScript(html)) === normalizedAST(getScript(newHTML));
const normalizedCSS = (source) =>
  source
    .match(/<style>([\s\S]*?)<\/style>/)[1]
    .replace(/\s/g, "")
    .replace(/(?<![0-9])0+\.(\d)/g, ".$1");
result.standalone.cssFormattingNormalizedEquivalent =
  normalizedCSS(html) === normalizedCSS(newHTML);
result.standalone.existingBytes = Buffer.byteLength(html);
result.standalone.generatedBytes = Buffer.byteLength(newHTML);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
for (const resource of [
  "/",
  "/engine.js",
  "/missing.txt",
  "/%E0%A4%A",
  "/..%5cpackage.json",
  "/favicon.ico",
  "/../package.json",
]) {
  const child = spawn(process.execPath, ["server.mjs"], {
    cwd: project,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stderr = "";
  child.stderr.on("data", (d) => (stderr += d));
  await new Promise((resolve, reject) => {
    child.stdout.once("data", resolve);
    child.once("error", reject);
    setTimeout(resolve, 2000);
  });
  const row = { resource };
  try {
    const response = await fetch("http://127.0.0.1:4173" + resource);
    row.status = response.status;
    row.bytes = (await response.arrayBuffer()).byteLength;
  } catch (error) {
    row.error = error.message;
  }
  await sleep(50);
  row.exitCode = child.exitCode;
  row.stderr = stderr;
  child.kill();
  await sleep(50);
  result.server.push(row);
}
const temp = await mkdtemp(path.join(tmpdir(), "neonstride-preview-audit-"));
await cp(path.join(project, "previews"), temp, { recursive: true });
const preview = spawn(
  "powershell.exe",
  [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    path.join(temp, "render-poses.ps1"),
  ],
  { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
);
let previewOutput = "";
preview.stdout.on("data", (d) => (previewOutput += d));
preview.stderr.on("data", (d) => (previewOutput += d));
result.preview.exitCode = await new Promise((resolve) =>
  preview.once("exit", resolve),
);
result.preview.output = previewOutput;
await cp(
  path.join(temp, "natural-run-cycle.png"),
  path.join(out, "preview-regenerated.png"),
);
for (const name of [
  "dist/index.html",
  "dist/style.css",
  "dist/engine.js",
  "dist/renderer.js",
  "dist/app.js",
  "server.mjs",
  "build-standalone.mjs",
  "tests/animation.test.mjs",
  "tests/engine.test.mjs",
  "tests/interface.test.mjs",
]) {
  const text = await readFile(path.join(project, name), "utf8");
  result.files.push({
    name,
    bytes: Buffer.byteLength(text),
    lines: text.split("\n").length,
  });
}
await writeFile(
  path.join(out, "deep-results.json"),
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result, null, 2));
