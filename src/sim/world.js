// world.js — the arena's dimensions, and the one place a pristine simulation is
// built.
//
// The physics engine itself lives behind src/sim/phys/facade.js; this module
// owns the *world*, not the *engine*, and no longer hands out an engine handle
// at all — the facade is the only door. It is a leaf on purpose: it imports
// nothing but the facade and gravity.js (itself a leaf on the facade), so the
// constants below are always initialised before any other sim module's body
// runs. gravity.js must NOT import this file back: an import cycle here would
// run its body — and its onWorldReset() call — while `resetHooks` below was
// still in its temporal dead zone. That is why createWorld() resets the gravity
// stack by hand instead of gravity.js registering a hook like everyone else.
// Modules that own mutable state register a reset hook here; createWorld() runs
// them all, which is what lets a second createSim() in the same process start
// from exactly the state the first one did (the vm sandbox used to get that for
// free from a fresh global scope).
//
// TWO MODULES ARE DELIBERATELY OUTSIDE THAT, and saying so here is the point —
// this paragraph used to claim the reset was total, which sent a reader looking
// for a hook that does not exist:
//
//   * src/sim/time.js — the tick counter. Reset by hand in createSim()
//     (src/platform/browser.js does not need it), because time.js is a leaf
//     that imports nothing at all and is kept that way.
//   * src/sim/rng.js — the round stream. NOT reset, and must not be: the stream
//     is caller-owned, which is what lets test/harness/tape.js fix a run's seed
//     by calling reseed() *before* createSim (loadMap(0) then draws the map seed
//     off it, and that draw is part of what the golden tape hashes). A hook that
//     rewound the stream to its initial seed would overwrite the caller's seed
//     and make every seed produce the same run.
//
// So a bare createSim() with no reseed() in front of it inherits wherever the
// previous sim left the stream. Callers that need a reproducible run seed it
// themselves; test/phase1-gate.test.js's sweep is the worked example.
import { createEngine, destroyEngine } from './phys/facade.js';
import { clearModifiers, setBase } from './gravity.js';

export const W = 1280, H = 720;

// A query region spanning everything between two x. Half a dozen sites ask
// "what is in this column?" — Updraft, Tornado, Firestorm, the tome drop, the
// platform picker, the spawn-safety check — and every one of them tested x
// alone. The vertical bounds are infinite rather than 0..H to keep it that way:
// a crate lobbed above the ceiling is still in the column. `column(x, x)` is
// the degenerate single-x form the drop-point searches want.
export function column(x0, x1 = x0) {
  return { min: { x: x0, y: -Infinity }, max: { x: x1, y: Infinity } };
}

const resetHooks = [];

// Register a callback that returns a module's mutable state to its initial
// value. Hooks must not depend on each other's ordering.
export function onWorldReset(fn) { resetHooks.push(fn); }

export function createWorld() {
  // createEngine() also resets matter-js's process-global RNG — see the long
  // note on resetPhysRandom() in src/sim/phys/matter-backend.js and the guard
  // in test/determinism.test.js.
  const engine = createEngine();
  // A pristine arena has the default base and nothing on the stack. Both halves
  // matter: a leftover modifier from the previous sim would silently scale the
  // new one's gravity for the rest of its life.
  clearModifiers();
  setBase(2);
  for (const fn of resetHooks) fn();
  return engine;
}

export function destroyWorld() {
  destroyEngine();
}
