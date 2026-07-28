// env.js — the one host facility the simulation cannot supply itself: a clock.
//
// The vm sandbox used to hand the sim a fake `performance` and a seeded
// `Math.random` through the context's global scope (server/shims.js). ES modules
// have no such scope, so sim code imported both from here instead.
//
// Randomness has since moved out entirely. The sim owns its stream in
// src/sim/rng.js and reseeds it per round from the map seed, so there is nothing
// left to inject and no `random` binding here to swap — a dead injection point
// is a trap, not a convenience. Nothing under src/sim calls Math.random any
// more, and test/module-boundaries.test.js keeps it that way.
//
// The clock has exactly two readers left, and neither is simulation state:
// src/sim/pace.js measures the hitstop it is itself slowing (see the comment
// there), and src/net/server-bridge.js ages wire inputs. Everything the sim
// simulates is on simNow() (src/sim/time.js) — tick x TICK_MS — so a duration
// content declares as `now + 1500` is 1500ms of GAME time. Injecting a clock
// therefore no longer moves the sim; it only moves those two real-time windows,
// which is why the tape harness still walks it in lockstep with the tick.

export let performance = globalThis.performance;

export function setClock(clock) {
  performance = clock || globalThis.performance;
}
