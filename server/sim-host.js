// sim-host.js — drives the headless sim: a drift-corrected ~60Hz tick calling
// the game's own stepSim, ~30Hz snapshots, per-tick fx batching, and a crash
// watchdog that rebuilds the vm context and re-seats connected players. The
// transport (room.js) only ever talks to this class.
'use strict';
const { performance } = require('perf_hooks');
const { createSimContext } = require('./sim-context');

const TICK_MS = 1000 / 60;
const SNAP_MS = 32; // ~30Hz, mirrors the old netHostTick gate

class SimHost {
  // opts: { onSnapshot(snapObj), onFx({f,a}), telemetrySink(rec) }
  constructor(opts) {
    this.opts = opts;
    this.fxQueue = [];
    this.buildContext();
  }

  buildContext() {
    this.sim = createSimContext({
      emitFx: (f, a) => this.fxQueue.push({ t: 'fx', f, a }),
      postTelemetry: rec => { try { this.opts.telemetrySink?.(rec); } catch {} },
      onPackUnlocked: src => { try { this.opts.onPackUnlocked?.(src); } catch {} },
    });
    this.bridge = this.sim.bridge;
  }

  start() {
    this.last = performance.now();
    this.lastSnapAt = 0;
    let next = performance.now() + TICK_MS;
    const loop = () => {
      const now = performance.now();
      const rawDt = Math.min(now - this.last, 33); // the browser's own frame clamp
      this.last = now;
      try {
        this.bridge.stepSim(now, rawDt);
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
    console.error('sim crashed — rebuilding context:', err.stack || err);
    try { this.sim.destroy(); } catch {}
    this.fxQueue = [];
    this.buildContext();
    this.opts.onCrash?.();
    this.start();
  }

  stop() {
    clearTimeout(this.timer);
    this.sim.destroy();
  }
}

module.exports = { SimHost };
