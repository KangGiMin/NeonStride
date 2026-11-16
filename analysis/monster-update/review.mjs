import http from "node:http";
import { spawn } from "node:child_process";
import { readFile, writeFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const root =
  "C:/Users/gimin/Desktop/NeonStride/.sites-release/.sites-checkout/dist";
const out = import.meta.dirname;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;padding:18px;background:#07111b;color:#d6e8dd;font:14px Arial}h1{font-size:22px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}article{background:#102331;border:1px solid #39505a;border-radius:5px;overflow:hidden}canvas{width:100%;height:250px;display:block}p{margin:10px 12px;color:#b4ff79}
</style></head><body><h1>MONSTER ATTACK — wind-up / acceleration / impact / follow-through</h1><div class="grid"></div>
<script type="module">
import {Scene} from '/renderer.js';import {Runner} from '/engine.js';import {monster} from '/rendering/obstacles/monster.js';
const frames=[[.25,'EMERGENCE'],[.55,'WIND-UP'],[.78,'FULL WIND-UP'],[.90,'ACCELERATION'],[.97,'FAST SWEEP'],[1,'CONTACT'],[1.04,'FOLLOW-THROUGH'],[1.1,'RECOVERY']];
const scenes=frames.map(([phase,label])=>{const item=document.createElement('article');item.innerHTML='<canvas></canvas><p>'+label+'</p>';document.querySelector('.grid').append(item);return {scene:new Scene(item.querySelector('canvas')),phase};});
requestAnimationFrame(()=>requestAnimationFrame(()=>{for(const {scene,phase} of scenes){const g=new Runner(()=>0);g.start();g.obstacles=[];scene.sky(0);scene.buildings(0);scene.road(0,[],14,'easy');scene.character(g,0,false);monster(scene,{type:'monster'},3,phase,0,g);}window.reviewReady=true;}));
</script></body></html>`;
const server = http.createServer(async (req, res) => {
  try {
    const name = new URL(req.url, "http://localhost").pathname;
    if (name === "/__review") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
      return;
    }
    const file = path.resolve(
      root,
      "." + (name === "/" ? "/index.html" : name),
    );
    if (!file.startsWith(path.resolve(root) + path.sep))
      throw Error("outside root");
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type":
        {
          ".html": "text/html",
          ".js": "text/javascript",
          ".css": "text/css",
          ".svg": "image/svg+xml",
          ".json": "application/json",
        }[path.extname(file)] || "application/octet-stream",
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(4181, "127.0.0.1", resolve));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const temp = await mkdtemp(path.join(tmpdir(), "neon-monster-review-"));
const results = { errors: [] };
let chrome, socket;
try {
  chrome = spawn(
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    [
      "--headless=new",
      "--remote-debugging-port=0",
      `--user-data-dir=${temp}`,
      "--no-first-run",
      "--no-default-browser-check",
      "about:blank",
    ],
    { windowsHide: true, stdio: "ignore" },
  );
  let port;
  for (let n = 0; n < 100; n++) {
    try {
      port = (
        await readFile(path.join(temp, "DevToolsActivePort"), "utf8")
      ).split("\n")[0];
      break;
    } catch {
      await delay(100);
    }
  }
  const targets = await (
    await fetch(`http://127.0.0.1:${port}/json/list`)
  ).json();
  socket = new WebSocket(
    targets.find((t) => t.type === "page").webSocketDebuggerUrl,
  );
  await new Promise((resolve) =>
    socket.addEventListener("open", resolve, { once: true }),
  );
  let id = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const m = JSON.parse(event.data);
    if (m.id) {
      const job = pending.get(m.id);
      pending.delete(m.id);
      m.error ? job.reject(m.error) : job.resolve(m.result);
    }
    if (m.method === "Runtime.exceptionThrown")
      results.errors.push(m.params.exceptionDetails);
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const n = ++id;
      pending.set(n, { resolve, reject });
      socket.send(JSON.stringify({ id: n, method, params }));
    });
  const evaluate = async (expression) => {
    const r = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true,
    });
    if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };
  const screenshot = async (name) => {
    await evaluate(
      "new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))",
    );
    const r = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    await writeFile(path.join(out, name), Buffer.from(r.data, "base64"));
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Page.navigate", { url: "http://127.0.0.1:4181/__review" });
  for (let n = 0; n < 100; n++) {
    if (await evaluate("window.reviewReady === true")) break;
    await delay(100);
  }
  await screenshot("attack-poses.png");
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: `Math.random=()=>.1875;window.__nativeRAF=requestAnimationFrame.bind(window);window.requestAnimationFrame=fn=>window.__frame=fn;window.__step=time=>window.__frame(time);`,
  });
  await send("Page.navigate", { url: "http://127.0.0.1:4181/" });
  for (let n = 0; n < 100; n++) {
    if (await evaluate("typeof window.__frame === 'function'")) break;
    await delay(100);
  }
  await evaluate(
    `(async()=>{const {Runner}=await import('./game/runner.js');const start=Runner.prototype.start;Runner.prototype.start=function(...args){window.__game=this;return start.apply(this,args)};__step(1000);document.getElementById('start').click();__step(1000);__step(3900);document.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',bubbles:true}));__step(4090);document.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',bubbles:true}));__step(4390);})()`,
  );
  await evaluate("new Promise(r=>__nativeRAF(()=>__nativeRAF(r)))");
  const shot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  await writeFile(
    path.join(out, "double-jump.png"),
    Buffer.from(shot.data, "base64"),
  );
  await evaluate("__step(4700)");
  results.doubleJump = await evaluate(
    "({status:__game.status,cleared:__game.cleared,score:__game.score})",
  );
  if (
    results.doubleJump.status !== "running" ||
    results.doubleJump.cleared !== 1
  )
    throw Error("Monster double-jump did not clear in browser");
  if (results.errors.length) throw Error("Browser reported script errors");
} finally {
  socket?.close();
  chrome?.kill();
  await new Promise((resolve) => server.close(resolve));
  await writeFile(
    path.join(out, "results.json"),
    JSON.stringify(results, null, 2),
  );
  console.log(JSON.stringify(results, null, 2));
}
