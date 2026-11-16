import http from "node:http";
import { spawn } from "node:child_process";
import { readFile, writeFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

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
  const load = async (width, height, mobile) => {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      mobile,
      deviceScaleFactor: 1,
    });
    await send("Page.navigate", { url: origin + "/" });
    for (let n = 0; n < 100; n++) {
      if (await evaluate("typeof window.__frame==='function'")) break;
      await delay(50);
    }
    await evaluate("document.getElementById('start').click();__frame(1000)");
    await delay(300);
  };
  for (const [width, height, mobile] of [
    [320, 568, true],
    [390, 844, true],
    [844, 390, true],
    [1280, 800, false],
  ]) {
    await load(width, height, mobile);
    results.layouts.push(
      await evaluate(`(()=>{
      const box=selector=>{const e=document.querySelector(selector),r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,display:getComputedStyle(e).display}};
      const arena=box('.arena');return {width:innerWidth,height:innerHeight,arena,touchControls:box('.touch-controls'),jumpButton:box('#touchJump'),runnerGroundY:arena.top+(arena.height-2)*(.36+3.6*.94/7),scrollHeight:document.documentElement.scrollHeight};
    })()`),
    );
    if (width === 320 || width === 844) {
      const shot = await send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
      });
      await writeFile(
        path.join(import.meta.dirname, `viewport-${width}x${height}.png`),
        Buffer.from(shot.data, "base64"),
      );
    }
  }
  await evaluate(
    "document.getElementById('pause').click();document.getElementById('help').focus()",
  );
  results.keyboardBefore = await evaluate(
    "({paused:document.querySelector('.arena').classList.contains('paused'),helpOpen:document.getElementById('helpDialog').open,focus:document.activeElement.id})",
  );
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    code: "Space",
    key: " ",
    windowsVirtualKeyCode: 32,
  });
  await send("Input.dispatchKeyEvent", {
    type: "keyUp",
    code: "Space",
    key: " ",
    windowsVirtualKeyCode: 32,
  });
  results.keyboardAfter = await evaluate(
    "({paused:document.querySelector('.arena').classList.contains('paused'),playing:document.querySelector('.arena').classList.contains('playing'),helpOpen:document.getElementById('helpDialog').open,focus:document.activeElement.id})",
  );
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await load(1280, 800, false);
  results.reducedMotion = await evaluate(`(async()=>{
    const {Scene}=await import('./renderer.js'),{Runner}=await import('./engine.js');
    const canvas=document.createElement('canvas');canvas.style.cssText='position:fixed;left:-1000px;width:400px;height:300px';document.body.append(canvas);
    const scene=new Scene(canvas),game=new Runner(()=>0);scene.render(game,0);const first=canvas.toDataURL();scene.render(game,1);const second=canvas.toDataURL();
    document.querySelector('.arena').classList.add('impact');
    const result={preferenceMatches:matchMedia('(prefers-reduced-motion: reduce)').matches,sceneReduced:scene.reduced,readyCanvasChanges:first!==second,impactFlashAnimation:getComputedStyle(document.querySelector('.arena'),'::after').animationName};
    scene.resizeObserver.disconnect();canvas.remove();return result;
  })()`);
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
