import { spawn } from "node:child_process";
import { readFile, writeFile, mkdtemp, cp, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const out = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(out, "../NeonStride/neon-stride");
const temp = await mkdtemp(path.join(tmpdir(), "neonstride-audit-"));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const results = {
  environment: { node: process.version, project },
  checks: [],
  exceptions: [],
  failedRequests: [],
};
let server, chrome, socket;
try {
  server = spawn(process.execPath, ["server.mjs"], {
    cwd: project,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stderr.on(
    "data",
    (data) => (results.serverStderr = (results.serverStderr || "") + data),
  );
  await sleep(300);
  chrome = spawn(
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    [
      "--headless=new",
      "--remote-debugging-port=0",
      `--user-data-dir=${temp}/chrome`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-background-networking",
      "about:blank",
    ],
    { windowsHide: true, stdio: "ignore" },
  );
  let debug;
  for (let i = 0; i < 100; i++) {
    try {
      debug = (
        await readFile(path.join(temp, "chrome/DevToolsActivePort"), "utf8")
      ).split("\n");
      break;
    } catch {
      await sleep(100);
    }
  }
  if (!debug) throw new Error("Chrome debug endpoint did not start");
  const targets = await (
    await fetch(`http://127.0.0.1:${debug[0]}/json/list`)
  ).json();
  socket = new WebSocket(
    targets.find((t) => t.type === "page").webSocketDebuggerUrl,
  );
  await new Promise((resolve) =>
    socket.addEventListener("open", resolve, { once: true }),
  );
  const pending = new Map();
  let id = 0;
  socket.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id) {
      const callback = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) callback?.reject(new Error(JSON.stringify(msg.error)));
      else callback?.resolve(msg.result);
    }
    if (msg.method === "Runtime.exceptionThrown")
      results.exceptions.push(msg.params.exceptionDetails);
    if (msg.method === "Network.loadingFailed")
      results.failedRequests.push(msg.params);
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const requestId = ++id;
      pending.set(requestId, { resolve, reject });
      socket.send(JSON.stringify({ id: requestId, method, params }));
    });
  const evaluate = async (expression) => {
    const response = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true,
    });
    if (response.exceptionDetails)
      throw new Error(JSON.stringify(response.exceptionDetails));
    return response.result.value;
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
  results.environment.browser = await send("Browser.getVersion");
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: `
    Math.random=()=>0;
    window.__nativeRAF=window.requestAnimationFrame.bind(window);
    window.__callbacks=[];
    window.requestAnimationFrame=callback=>(window.__callbacks.push(callback),window.__callbacks.length);
    window.__step=stamp=>{window.__lastStamp=stamp;const callbacks=window.__callbacks.splice(0);callbacks.forEach(fn=>fn(stamp));};
  `,
  });
  const layout = () => `(() => {
    const rect=id=>{const r=document.querySelector(id).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};};
    return {viewport:{width:innerWidth,height:innerHeight},docWidth:document.documentElement.scrollWidth,docHeight:document.documentElement.scrollHeight,
      arena:rect('.arena'),intro:rect('#intro'),start:rect('#start'),touch:rect('#touchControls'),canvas:rect('#scene'),fonts:document.fonts.status,
      centerHit:document.elementFromPoint(innerWidth/2,Math.min(innerHeight-10,document.querySelector('.arena').getBoundingClientRect().bottom-150))?.id};
  })()`;
  const screenshot = async (filename) => {
    await sleep(100);
    await evaluate(`__step(__lastStamp)`);
    await evaluate(
      `new Promise(resolve=>__nativeRAF(()=>__nativeRAF(resolve)))`,
    );
    const canvasData = await evaluate(
      `document.getElementById('scene').toDataURL()`,
    );
    if (filename === "desktop-running.png") {
      await writeFile(
        path.join(out, "desktop-canvas.png"),
        Buffer.from(canvasData.split(",")[1], "base64"),
      );
      results.checks.push({
        name: "desktop-canvas-state",
        value: await evaluate(
          `({w:__scene.w,h:__scene.h,pixelWidth:__scene.canvas.width,pixelHeight:__scene.canvas.height,callbacks:__callbacks.length,pixel:Array.from(__scene.ctx.getImageData(300,300,1,1).data)})`,
        ),
      });
    }
    await sleep(100);
    const { data } = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    await writeFile(path.join(out, filename), Buffer.from(data, "base64"));
  };
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Page.navigate", { url: "http://127.0.0.1:4173/" });
  for (let i = 0; i < 100; i++) {
    if (await evaluate(`typeof __step==='function' && __callbacks.length>0`))
      break;
    await sleep(100);
  }
  await evaluate(
    `(async()=>{const {Scene}=await import('./renderer.js');const render=Scene.prototype.render;Scene.prototype.render=function(...args){window.__scene=this;return render.apply(this,args)}})()`,
  );
  await evaluate(`__step(100)`);
  results.checks.push({
    name: "desktop-ready",
    layout: await evaluate(layout()),
  });
  await screenshot("desktop-ready.png");
  await evaluate(
    `(async()=>{const {Runner}=await import('./engine.js');const original=Runner.prototype.start;Runner.prototype.start=function(...args){window.__game=this;return original.apply(this,args)};document.getElementById('start').click();__game.obstacles=[];__game.nextPosition=1e9;__step(1100);})()`,
  );
  results.checks.push({
    name: "start-and-score",
    state: await evaluate(
      `({status:__game.status,elapsed:__game.elapsed,score:document.getElementById('score').textContent})`,
    ),
  });
  await screenshot("desktop-running.png");
  await evaluate(
    `document.getElementById('pause').click();__step(2100);document.getElementById('help').focus();`,
  );
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: " ",
    code: "Space",
    windowsVirtualKeyCode: 32,
  });
  await send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: " ",
    code: "Space",
    windowsVirtualKeyCode: 32,
  });
  results.checks.push({
    name: "space-on-focused-help",
    state: await evaluate(
      `({status:__game.status,helpOpen:helpDialog.open,focused:document.activeElement.id})`,
    ),
  });
  await evaluate(
    `document.getElementById('pause').click();document.getElementById('help').click();`,
  );
  results.checks.push({
    name: "mouse-help-opens",
    state: await evaluate(`({status:__game.status,helpOpen:helpDialog.open})`),
  });
  await evaluate(`helpDialog.close();`);
  for (const [width, height] of [
    [375, 812],
    [320, 568],
    [768, 1024],
    [844, 390],
  ]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 900,
    });
    await evaluate(
      `document.getElementById('restart').click();__game.obstacles=[];__game.nextPosition=1e9;__step(2200);`,
    );
    results.checks.push({
      name: `layout-${width}x${height}`,
      layout: await evaluate(layout()),
    });
    if (width === 375) await screenshot("mobile-running.png");
    if (width === 844) await screenshot("landscape-running.png");
  }
  await send("Emulation.setDeviceMetricsOverride", {
    width: 375,
    height: 812,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await evaluate(
    `document.getElementById('restart').click();__game.obstacles=[];__game.nextPosition=1e9;__step(3000);document.getElementById('touchSlide').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch'}));`,
  );
  const slideBefore = await evaluate(
    `({sliding:__game.sliding,held:__game.slideHeld,time:__game.slideTime})`,
  );
  await evaluate(`__step(4100)`);
  results.checks.push({
    name: "touch-slide-still-held-after-1.1s",
    before: slideBefore,
    after: await evaluate(
      `({sliding:__game.sliding,held:__game.slideHeld,time:__game.slideTime})`,
    ),
  });
  await evaluate(`document.getElementById('pause').click();__step(4200);`);
  await screenshot("mobile-paused.png");
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  results.checks.push({
    name: "reduced-motion-ready-pixels",
    value: await evaluate(`(async()=>{
    const {Scene}=await import('./renderer.js');const {Runner}=await import('./engine.js');
    const canvas=document.createElement('canvas');canvas.style='width:375px;height:490px';document.body.append(canvas);
    const scene=new Scene(canvas),g=new Runner(()=>0);scene.render(g,0);const a=canvas.toDataURL();scene.render(g,1);const b=canvas.toDataURL();canvas.remove();
    return {reduced:scene.reduced,pixelsChanged:a!==b};})()`),
  });
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  results.checks.push({
    name: "canvas-command-submission-cost",
    value: await evaluate(`(async()=>{
    const {Scene}=await import('./renderer.js');const {Runner}=await import('./engine.js');
    const scene=new Scene(document.getElementById('scene')),g=new Runner(()=>0);g.start();
    for(let i=0;i<5;i++)scene.render(g,i/60);const times=[];
    for(let i=0;i<60;i++){const t=performance.now();scene.render(g,i/60);times.push(performance.now()-t)}
    times.sort((a,b)=>a-b);return {frames:times.length,medianMs:times[30],p95Ms:times[57],maxMs:times[59]};})()`),
  });
  await cp(project, path.join(temp, "build"), { recursive: true });
  const build = spawn(process.execPath, ["build-standalone.mjs"], {
    cwd: path.join(temp, "build"),
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let buildOutput = "";
  build.stdout.on("data", (d) => (buildOutput += d));
  build.stderr.on("data", (d) => (buildOutput += d));
  const buildCode = await new Promise((resolve) => build.once("exit", resolve));
  results.checks.push({
    name: "standalone-build-isolated-copy",
    code: buildCode,
    output: buildOutput,
  });
  await mkdir(path.join(out, "generated"), { recursive: true });
  await cp(
    path.join(temp, "build/NEON-STRIDE.html"),
    path.join(out, "generated/NEON-STRIDE.html"),
  );
  await send("Page.navigate", {
    url: pathToFileURL(path.join(temp, "build/NEON-STRIDE.html")).href,
  });
  for (let i = 0; i < 100; i++) {
    if (await evaluate(`typeof __step==='function' && __callbacks.length>0`))
      break;
    await sleep(100);
  }
  await evaluate(
    `__step(100);document.getElementById('start').click();__step(1100)`,
  );
  results.checks.push({
    name: "rebuilt-standalone-file-protocol",
    value: await evaluate(
      `({title:document.title,playing:document.querySelector('.arena').classList.contains('playing'),score:document.getElementById('score').textContent})`,
    ),
  });
  await send("Page.navigate", {
    url: pathToFileURL(path.join(project, "NEON-STRIDE.html")).href,
  });
  for (let i = 0; i < 100; i++) {
    if (await evaluate(`typeof __step==='function' && __callbacks.length>0`))
      break;
    await sleep(100);
  }
  await evaluate(
    `__step(100);document.getElementById('start').click();__step(1100)`,
  );
  results.checks.push({
    name: "existing-standalone-file-protocol",
    value: await evaluate(
      `({title:document.title,playing:document.querySelector('.arena').classList.contains('playing'),score:document.getElementById('score').textContent})`,
    ),
  });
} catch (error) {
  results.fatal = error.stack;
  process.exitCode = 1;
} finally {
  socket?.close();
  chrome?.kill();
  server?.kill();
  await writeFile(
    path.join(out, "browser-results.json"),
    JSON.stringify(results, null, 2),
  );
  console.log(JSON.stringify(results, null, 2));
}
