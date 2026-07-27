// world.js — the arena's dimensions, and the one place a pristine simulation is
// built.
//
// The physics engine itself lives behind src/sim/phys/facade.js; this module
// owns the *world*, not the *engine*, and no longer hands out an engine handle
// at all — the facade is the only door. It is a leaf on purpose: it imports
// nothing but the facade, so the constants below are always initialised before
// any other sim module's body runs. Modules that own mutable state register a
// reset hook here; createWorld() runs them all, which is what lets a second
// createSim() in the same process start from exactly the state the first one
// did (the vm sandbox used to get that for free from a fresh global scope).
import { createEngine, destroyEngine, setGravityY } from './phys/facade.js';

export const W = 1280, H = 720;

const resetHooks = [];

// Register a callback that returns a module's mutable state to its initial
// value. Hooks must not depend on each other's ordering.
export function onWorldReset(fn) { resetHooks.push(fn); }

export function createWorld() {
  // createEngine() also resets matter-js's process-global RNG — see the long
  // note on resetPhysRandom() in src/sim/phys/matter-backend.js and the guard
  // in test/determinism.test.js.
  const engine = createEngine();
  setGravityY(2);
  for (const fn of resetHooks) fn();
  return engine;
}

export function destroyWorld() {
  destroyEngine();
}
