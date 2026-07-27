// sim-host.js — drives the headless sim: a drift-corrected ~60Hz tick calling
// the game's own stepSim, ~30Hz snapshots, per-tick fx batching, and a crash
// watchdog that rebuilds the sim and re-seats connected players. The transport
// (room.js) only ever talks to this class.
//
// The sim itself is ESM (src/platform/node.js) and this file is CommonJS, so the
// factory arrives through a dynamic import that start() awaits before its first
// tick.
'use strict';
const { performance } = require('perf_hooks');
let createSim = null;
let createTickLoop = null;
let advanceTick = null;
async function loadSimFactory() {
  if (!createSim) {
    ({ createSim } = await import('../src/platform/node.js'));
    ({ createTickLoop } = await import('../src/sim/tick-loop.js'));
    ({ advanceTick } = await import('../src/sim/time.js'));
  }
  return createSim;
}

const TICK_MS = 1000 / 60;
const SNAP_MS = 32; // ~30Hz, mirrors the old netHostTick gate

class SimHost {
  // opts: { onSnapshot(snapObj), onFx({f,a}), telemetrySink(rec) }
  constructor(opts) {
    this.opts = opts;
    this.fxQueue = [];
  }

  buildContext() {
    this.sim = createSim({
      onFx: (f, a) => this.fxQueue.push({ t: 'fx', f, a }),
      telemetrySink: rec => { try { this.opts.telemetrySink?.(rec); } catch {} },
      onPackUnlocked: src => { try { this.opts.onPackUnlocked?.(src); } catch {} },
    });
    this.bridge = this.sim.bridge;
  }

  async start() {
    await loadSimFactory();
    if (!this.sim) this.buildContext();
    this.last = performance.now();
    this.lastSnapAt = 0;
    this.droppedMs = 0;
    this.lastDropLog = this.last;
    // The timer below aims for a 60Hz wall-clock heartbeat; the accumulator is
    // what decides how many fixed steps that heartbeat actually paid for. A
    // stalled host (GC, disk) therefore catches up in whole TICK_MS steps up to
    // MAX_CATCHUP, and anything beyond that is reported rather than silently
    // run slow. Rebuilt fresh in every start() so a crash never inherits a
    // stale backlog.
    let stepNow = this.last;
    this.loop = createTickLoop({
      step: (dt) => { this.bridge.stepSim(stepNow, dt); advanceTick(); },
    });
    let next = performance.now() + TICK_MS;
    const loop = () => {
      const now = performance.now();
      try {
        // stepSim's `now` stays the host's real clock: the sim writes its
        // deadlines with performance.now() and Task 4 is what moves them to
        // simNow(). Only the STEP SIZE is fixed here.
        stepNow = now;
        const { dropped } = this.loop.pump(now - this.last);
        this.last = now;
        if (dropped > 0) {
          this.droppedMs += dropped;
          if (now - this.lastDropLog > 10000) {
            this.lastDropLog = now;
            console.warn(`sim behind: dropped ${Math.round(this.droppedMs)}ms of catch-up in 10s`);
            this.droppedMs = 0;
          }
        }
      } catch (err) {
        this.crash(err);
        return;
      }
      if (this.fxQueue.length) {
        const batch = this.fxQueue;
        this.fxQueue = [];
        for (const fx of batch) this.opts.onFx?.(fx);
      }
      if (now - this.lastSnapAt >= SNAP_MS) {
        this.lastSnapAt = now;
        try {
          const snap = this.bridge.takeWireSnapshot(now);
          if (snap) this.opts.onSnapshot?.(snap);
        } catch (err) {
          this.crash(err);
          return;
        }
      }
      next += TICK_MS;
      if (next < now) next = now + TICK_MS; // stalled (GC, disk): resync, don't burst
      this.timer = setTimeout(loop, Math.max(0, next - performance.now()));
    };
    this.timer = setTimeout(loop, 0);
  }

  // a sim exception must not kill the server: flush the old context's timers,
  // rebuild fresh, and let the room re-seat everyone. Clients are stateless
  // snapshot renderers — they just see the match reset.
  crash(err) {
    console.error('sim crashed — rebuilding the sim:', err.stack || err);
    try { this.sim.destroy(); } catch {}
    this.fxQueue = [];
    this.buildContext();
    this.opts.onCrash?.();
    this.start(); // the factory is already loaded, so this resumes synchronously
  }

  stop() {
    clearTimeout(this.timer);
    this.sim?.destroy();
  }
}

module.exports = { SimHost };
