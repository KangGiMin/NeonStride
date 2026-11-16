import assert from "node:assert/strict";

export function createCanvasHost() {
  const stats = { drawCount: 0, clipCount: 0, lastClipRect: undefined };
  const gradient = { addColorStop() {} };
  const context = new Proxy(
    {
      createLinearGradient: () => gradient,
      createRadialGradient: () => gradient,
      measureText: (text) => ({ width: text.length * 6 }),
      clip: () => stats.clipCount++,
      rect: (...args) => {
        stats.lastClipRect = args;
      },
    },
    {
      get(target, key) {
        return key in target
          ? target[key]
          : (...args) => {
              stats.drawCount++;
              for (const arg of args)
                if (typeof arg === "number")
                  assert.ok(
                    Number.isFinite(arg),
                    `${String(key)} received invalid coordinate`,
                  );
            };
      },
      set(target, key, value) {
        if (key === "globalAlpha")
          assert.ok(
            Number.isFinite(value) && value >= 0 && value <= 1,
            "drawing opacity must be valid",
          );
        target[key] = value;
        return true;
      },
    },
  );
  class Element {
    constructor() {
      this.handlers = {};
      this.hidden = false;
      this.textContent = "";
      this.style = {};
      this.children = [];
      this.classes = new Set();
      this.classList = {
        toggle: (name, on) =>
          on ? this.classes.add(name) : this.classes.delete(name),
      };
    }
    addEventListener(name, fn) {
      this.handlers[name] = fn;
    }
    removeEventListener(name, fn) {
      if (this.handlers[name] === fn) delete this.handlers[name];
    }
    setAttribute(name, value) {
      this[name] = value;
    }
    blur() {}
    showModal() {
      this.open = true;
    }
    close() {
      this.open = false;
    }
    getBoundingClientRect() {
      return {
        width: 1280,
        height: 640,
        left: 0,
        right: 1280,
        top: 0,
        bottom: 640,
      };
    }
    getContext() {
      return context;
    }
    fire(name, event = {}) {
      this.handlers[name]?.({
        preventDefault() {},
        stopPropagation() {},
        ...event,
      });
    }
  }
  globalThis.devicePixelRatio = 1;
  globalThis.matchMedia = () => ({ matches: false });
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
  return Object.assign(stats, { Element, context });
}
