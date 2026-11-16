export function createEvents() {
  const cleanups = [];
  return {
    on(target, type, handler) {
      target.addEventListener(type, handler);
      cleanups.push(() => target.removeEventListener?.(type, handler));
    },
    destroy() {
      cleanups.splice(0).forEach((cleanup) => cleanup());
    },
  };
}
