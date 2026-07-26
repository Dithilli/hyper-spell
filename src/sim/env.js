// env.js — the two host facilities the simulation cannot supply itself: a clock
// and a random source.
//
// The vm sandbox used to hand the sim a fake `performance` and a seeded
// `Math.random` through the context's global scope (server/shims.js). ES modules
// have no such scope, so sim code imports `performance` from here instead: the
// identifier still reads `performance.now()` at every call site, but it resolves
// to whatever the host injected. Task 4 replaces those call sites with simNow()
// and Task 5 replaces setRandom with the seeded stream registry; until then this
// module is what makes a headless run reproducible.

export let performance = globalThis.performance;

export function setClock(clock) {
  performance = clock || globalThis.performance;
}

// Seeding is a global swap, exactly as the sandbox did it
// (server/sim-context.js:59 rewrote Math.random inside the context). Production
// passes nothing and keeps the platform generator; tests pass a seeded one and
// restoreRandom() puts the original back when the sim is destroyed.
let originalRandom = null;

export function setRandom(random) {
  if (!random || random === Math.random) return;
  if (originalRandom === null) originalRandom = Math.random;
  Math.random = random;
}

export function restoreRandom() {
  if (originalRandom === null) return;
  Math.random = originalRandom;
  originalRandom = null;
}
