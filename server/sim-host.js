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
async function loadSimFactory() {
  if (!createSim) {
    ({ createSim } = await import('../src/platform/node.js'));
    ({ createTickLoop } = await import('../src/sim/tick-loop.js'));
  }
  return createSim;
}

const TICK_MS = 1000 / 60;
const SNAP_MS = 32; // ~30Hz, mirrors the old netHostTick gate

class SimHost {
  // opts: { onSnapshot(snapObj), onFx({f,a}), onCrash(), onPackUnlocked(src), telemetrySink(rec) }
  constructor(opts = {}) {
    this.opts = { ...opts };
    this.fxQueue = [];
  }

  // The transport registers its callbacks here rather than assigning into
  // `opts` from outside. The host owns its own field, and what a room needs
  // from it is stated in one place instead of four assignments in the room's
  // constructor.
  setHandlers(handlers) {
    Object.assign(this.opts, handlers);
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
    // stepSim takes nothing and advances the sim's own tick: the host's wall
    // clock decides HOW MANY steps the elapsed time paid for, and nothing else.
    // It must not advance the tick here as well — that would run sim time at
    // double rate.
    this.loop = createTickLoop({ step: () => this.bridge.stepSim() });
    let next = performance.now() + TICK_MS;
    const loop = () => {
      const now = performance.now();
      try {
        const { dropped } = this.loop.pump(now - this.last);
        this.last = now;
        if (dropped > 0) this.droppedMs += dropped;
        // The window closes on schedule whether or not this tick dropped
        // anything. Advancing it only on a drop would label the total with
        // however long ago the previous drop was ("55s worth in 10s"), and
        // would leave a burst followed by quiet sitting in droppedMs unprinted.
        if (now - this.lastDropLog >= 10000) {
          if (this.droppedMs > 0) {
            // paced sim milliseconds, not wall milliseconds: the accumulator
            // counts real time already multiplied by paceScale()
            console.warn(`sim behind: dropped ${Math.round(this.droppedMs)}ms of paced sim time in the last 10s`);
          }
          this.lastDropLog = now;
          this.droppedMs = 0;
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
          // no `now`: the serializer reads simNow(), because every deadline it
          // compares (frozenUntil, cooldowns, the killcam tape) is sim time
          const snap = this.bridge.takeWireSnapshot();
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
