// env.js — the two host facilities the simulation cannot supply itself: a clock
// and a random source.
//
// The vm sandbox used to hand the sim a fake `performance` and a seeded
// `Math.random` through the context's global scope (server/shims.js). ES modules
// have no such scope, so sim code imports both from here instead. The clock's
// call sites still read `performance.now()` verbatim — Task 4 replaces them with
// simNow() — and the random source is a plain `random()`.
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
