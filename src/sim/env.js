// env.js — the two host facilities the simulation cannot supply itself: a clock
// and a random source.
//
// The vm sandbox used to hand the sim a fake `performance` and a seeded
// `Math.random` through the context's global scope (server/shims.js). ES modules
// have no such scope, so sim code imports both from here instead.
//
// The clock has exactly two readers left, and neither is simulation state:
// src/sim/pace.js measures the hitstop it is itself slowing (see the comment
// there), and src/net/server-bridge.js ages wire inputs. Everything the sim
// simulates is on simNow() (src/sim/time.js) — tick x TICK_MS — so a duration
// content declares as `now + 1500` is 1500ms of GAME time. Injecting a clock
// therefore no longer moves the sim; it only moves those two real-time windows,
// which is why the tape harness still walks it in lockstep with the tick.
//
// Seeding is a swap of the binding below, not of the platform Math.random:
// nothing under src/sim calls Math.random any more, so a seeded run cannot leak
// entropy into, or draw it from, anything else sharing the process. Task 5
// replaces this single stream with the per-subsystem seeded registry.

export let performance = globalThis.performance;

export function setClock(clock) {
  performance = clock || globalThis.performance;
}

export let random = Math.random;

export function setRandom(fn) {
  random = fn || Math.random;
}

export function restoreRandom() {
  random = Math.random;
}
