// shims.js — the sandbox globals that let the browser game files load headless.
// The game scripts assume a browser: core.js grabs canvas/ctx at load, input.js
// registers key listeners, events.js builds an offscreen canvas, enemies.js reads
// localStorage. None of that decides game state, so every browser surface here is
// an inert stand-in. What IS load-bearing: performance (the sim's only clock),
// setTimeout (round flow scheduling — tracked so teardown can flush), and Math.
'use strict';

function makeCtxProxy(counter) {
  // callable, self-returning: ctx.save(), ctx.fillStyle = x, ctx.measureText(s).width
  // all silently succeed. Nothing in the sim path should ever get here — the
  // counter is the tripwire that proves it (sim-smoke asserts it stays 0).
  const target = function () {};
  const proxy = new Proxy(target, {
    get(t, prop) {
      if (prop === Symbol.toPrimitive) return () => 0;
      counter.calls++;
      return proxy;
    },
    set() { counter.calls++; return true; },
    apply() { counter.calls++; return proxy; },
  });
  return proxy;
}

function makeFakeCanvas(counter) {
  return {
    width: 1280, height: 720,
    getContext: () => makeCtxProxy(counter),
    // deliberately NO addEventListener — input.js guards on typeof and skips
    // its mouse hookup when the method is missing
  };
}

// buildSandbox returns the object to pass to vm.createContext plus the handles
// the host needs (timer flush, ctx tripwire).
function buildSandbox({ clock } = {}) {
  const ctxCounter = { calls: 0 };
  const timers = new Set();

  const sandbox = {
    console,
    performance: clock || performance,
    Date, // telemetry stamps records with Date.now(); nothing else reads wall time
    // the content-pack loader (js/extra-content.js) needs the web platform's
    // crypto/compression surface — Node has all of it natively
    crypto: globalThis.crypto,
    TextEncoder, TextDecoder, atob: globalThis.atob, URL,
    Blob: globalThis.Blob, Response: globalThis.Response,
    DecompressionStream: globalThis.DecompressionStream,
    document: {
      getElementById: () => makeFakeCanvas(ctxCounter),
      createElement: (tag) => (tag === 'canvas' ? makeFakeCanvas(ctxCounter) : {}),
    },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    navigator: { getGamepads: () => [] },
    // the content pack preloads its sprites with new Image() — headless they're
    // never drawn, so an inert stand-in (src accepted, onload never fires) works
    Image: class Image { },
    requestAnimationFrame: () => 0, // game.js self-starts its loop; headless it never ticks
    addEventListener() {},
    removeEventListener() {},
    // round flow schedules respawns/next-rounds via setTimeout — track every
    // handle so destroy() can flush them instead of letting them fire into a
    // torn-down world
    setTimeout(fn, ms, ...args) {
      const h = setTimeout(() => { timers.delete(h); fn(...args); }, ms, ...args);
      timers.add(h);
      return h;
    },
    clearTimeout(h) { timers.delete(h); clearTimeout(h); },
    setInterval(fn, ms, ...args) {
      const h = setInterval(fn, ms, ...args);
      timers.add(h);
      return h;
    },
    clearInterval(h) { timers.delete(h); clearInterval(h); },
  };

  return {
    sandbox,
    ctxCounter,
    flushTimers() {
      for (const h of timers) { clearTimeout(h); clearInterval(h); }
      timers.clear();
    },
  };
}

module.exports = { buildSandbox };
