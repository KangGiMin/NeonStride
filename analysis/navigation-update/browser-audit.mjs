import http from "node:http";
import { spawn } from "node:child_process";
import { readFile, writeFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "../../neon-stride/dist");
const results = { errors: [], layouts: [] };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, "http://localhost").pathname;
    const file = path.resolve(
      root,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
    if (!file.startsWith(root + path.sep)) throw Error("Invalid path");
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type":
        {
          ".html": "text/html; charset=utf-8",
          ".js": "text/javascript",
          ".css": "text/css",
          ".svg": "image/svg+xml",
        }[path.extname(file)] || "application/octet-stream",
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const profile = await mkdtemp(path.join(tmpdir(), "neon-code-review-"));
let chrome, socket;
try {
  chrome = spawn(
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    [
      "--headless=new",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
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
        await readFile(path.join(profile, "DevToolsActivePort"), "utf8")
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
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const job = pending.get(message.id);
      pending.delete(message.id);
      message.error ? job.reject(message.error) : job.resolve(message.result);
    }
    if (message.method === "Runtime.exceptionThrown")
      results.errors.push(message.params.exceptionDetails);
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++sequence;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true,
    });
    if (result.exceptionDetails)
      throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source:
      "window.__nativeRAF=requestAnimationFrame.bind(window);window.requestAnimationFrame=fn=>window.__frame=fn;",
  });

  const load = async (width = 1280, height = 900, mobile = false) => {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      mobile,
      deviceScaleFactor: 1,
    });
    await send("Emulation.setTouchEmulationEnabled", { enabled: mobile });
    await send("Page.navigate", { url: origin + "/" });
    for (let n = 0; n < 100; n++) {
      if (await evaluate("typeof window.__frame==='function'")) break;
      await delay(50);
    }
    await evaluate(
      "(async()=>{const {Runner}=await import('./engine.js');const original=Runner.prototype.start;Runner.prototype.start=function(...args){window.__game=this;return original.apply(this,args)};window.__time=1000;document.getElementById('start').click();__frame(__time);})()",
    );
    await delay(150);
  };
  const step = (ms) => evaluate("__time+=" + ms + ";__frame(__time)");
  const shot = async (name) => {
    await delay(60);
    const result = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    await writeFile(
      path.join(import.meta.dirname, name + ".png"),
      Buffer.from(result.data, "base64"),
    );
  };
  const key = async (code, down = true, shift = false) =>
    send("Input.dispatchKeyEvent", {
      type: down ? "keyDown" : "keyUp",
      code,
      key:
        code === "ArrowRight"
          ? "ArrowRight"
          : code === "ArrowLeft"
            ? "ArrowLeft"
            : "Shift",
      modifiers: shift ? 8 : 0,
      windowsVirtualKeyCode:
        code === "ArrowRight" ? 39 : code === "ArrowLeft" ? 37 : 16,
    });
  const fresh = () =>
    evaluate(
      "document.getElementById('restart').click();__game.obstacles=[];__game.nextPosition=1e9;__game.corners=[];__game.nextCorner=1e9",
    );
  await load();
  await fresh();
  results.colors = await evaluate(
    "['easy','normal','hard','extreme'].map(id=>({id,color:getComputedStyle(document.getElementById('difficulty-'+id)).color}))",
  );
  assert.equal(new Set(results.colors.map((c) => c.color)).size, 4);
  await key("ArrowRight");
  await step(200);
  await key("ArrowRight", false);
  results.steer = await evaluate("({x:__game.x,steer:__game.steer})");
  assert.ok(results.steer.x > 1);
  assert.equal(results.steer.steer, 0);
  await fresh();
  await evaluate(
    "(async()=>{const{makeCorner}=await import('./game/navigation/route.js');__game.corners=[makeCorner(null,__game.speed*1.8,1)];})()",
  );
  await step(40);
  await shot("right-corner-approach");
  await step(1200);
  await key("ShiftLeft");
  await key("ArrowRight", true, true);
  await key("ArrowRight", false, true);
  await key("ShiftLeft", false);
  await step(700);
  await shot("right-corner-turn");
  results.rightTurn = await evaluate(
    "({status:__game.status,heading:__game.heading,turns:__game.turnsCompleted})",
  );
  assert.equal(results.rightTurn.turns, 1);
  assert.equal(results.rightTurn.status, "running");
  await step(500);
  await evaluate(
    "(async()=>{const{makeCorner}=await import('./game/navigation/route.js');__game.corners.push(makeCorner(__game.corners.at(-1),__game.distance+__game.speed*.45,-1));})()",
  );
  await key("ArrowLeft", true, true);
  await key("ArrowLeft", false);
  await step(600);
  await shot("left-corner-turn");
  results.leftTurn = await evaluate(
    "({status:__game.status,heading:__game.heading,turns:__game.turnsCompleted})",
  );
  assert.equal(results.leftTurn.turns, 2);
  assert.equal(results.leftTurn.heading, 0);
  results.hazards = [];
  for (const [type, variant] of [
    ["energy", 1],
    ["emp", 1],
    ["patrol", 1],
    ["patrol", 2],
    ["shutter", 1],
    ["shutter", 2],
    ["airstrike", 1],
  ]) {
    await fresh();
    await evaluate(
      "(async()=>{const g=__game;const o={type:" +
        JSON.stringify(type) +
        ",variant:" +
        variant +
        ',position:g.distance+g.speed*.65,length:1.25,id:2,phase:2.15};if(o.type==="emp"){o.position=g.distance-2;o.length=g.speed*3;}if(o.type==="airstrike"){const{createStrikes}=await import("./game/obstacles/dynamic.js");o.length=g.speed*1.5;o.strikes=createStrikes(o.position,g.speed);}g.obstacles=[o];})()',
    );
    await step(40);
    await shot(type + "-" + variant);
    results.hazards.push(
      await evaluate(
        "({type:" +
          JSON.stringify(type) +
          ",variant:" +
          variant +
          ',status:__game.status,emp:__game.empStrength,cue:document.getElementById("hazardCue").textContent})',
      ),
    );
  }
  await fresh();
  await evaluate(
    '(async()=>{const{createStrikes}=await import("./game/obstacles/dynamic.js");__game.x=2.35;const o={type:"airstrike",position:__game.distance-.02,length:__game.speed*1.5,id:1};o.strikes=createStrikes(o.position,__game.speed);o.strikes.forEach(s=>s.x=0);__game.obstacles=[o];})()',
  );
  await step(40);
  await shot("airstrike-firing");
  assert.equal(await evaluate("__game.status"), "running");
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [844, 390],
  ]) {
    await load(width, height, true);
    await fresh();
    await step(40);
    const layout = await evaluate(
      '(()=>{const r=document.querySelector(".arena").getBoundingClientRect();const b=document.getElementById("touchRight").getBoundingClientRect();return{width:innerWidth,height:innerHeight,arenaBottom:r.bottom,arenaTop:r.top,buttonTop:b.top,buttonBottom:b.bottom,runnerGroundY:r.top+(r.height-2)*(.36+3.6*.94/7),display:getComputedStyle(document.getElementById("touchControls")).display};})()',
    );
    results.layouts.push(layout);
    assert.ok(layout.runnerGroundY < height);
    assert.ok(layout.buttonBottom <= height);
    assert.equal(layout.display, "flex");
    await shot("mobile-" + width + "x" + height);
  }
  await send("Page.navigate", {
    url: pathToFileURL(path.resolve(root, "../NEON-STRIDE.html")).href,
  });
  for (let n = 0; n < 100; n++) {
    if (await evaluate("typeof window.__frame==='function'")) break;
    await delay(50);
  }
  results.standalone = await evaluate(
    "document.getElementById('start').click();__frame(1000);__frame(1100);({playing:document.querySelector('.arena').classList.contains('playing'),score:document.getElementById('score').textContent})",
  );
  assert.ok(results.standalone.playing);
  assert.equal(results.errors.length, 0);
} finally {
  socket?.close();
  chrome?.kill();
  await new Promise((resolve) => server.close(resolve));
  await writeFile(
    path.join(import.meta.dirname, "browser-results.json"),
    JSON.stringify(results, null, 2),
  );
  console.log(JSON.stringify(results, null, 2));
}
