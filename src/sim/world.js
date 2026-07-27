// world.js — the arena's dimensions, and the one place a pristine simulation is
// built.
//
// The physics engine itself lives behind src/sim/phys/facade.js; this module
// owns the *world*, not the *engine*. It is a leaf on purpose: it imports
// nothing but the facade, so the constants below are always initialised before
// any other sim module's body runs. Modules that own mutable state register a
// reset hook here; createWorld() runs them all, which is what lets a second
// createSim() in the same process start from exactly the state the first one
// did (the vm sandbox used to get that for free from a fresh global scope).
import { createEngine, destroyEngine, setGravityY } from './phys/facade.js';

// MIGRATION SHIM — task 8's sweep converts src/sim file by file, and files not
// yet converted still import the raw matter-js namespaces from here. Removed
// when the last one is converted; test/module-boundaries.test.js then holds the
// line.
import { __raw } from './phys/matter-backend.js';
export const { Common, Engine, Bodies, Body, Composite, Constraint, Events, Query, Vector } = __raw;

export const W = 1280, H = 720;

export let engine = null;
export let world = null;

const resetHooks = [];

// Register a callback that returns a module's mutable state to its initial
// value. Hooks must not depend on each other's ordering.
export function onWorldReset(fn) { resetHooks.push(fn); }

export function createWorld() {
  // createEngine() also resets matter-js's process-global RNG — see the long
  // note on resetPhysRandom() in src/sim/phys/matter-backend.js and the guard
  // in test/determinism.test.js.
  engine = createEngine();
  setGravityY(2);
  world = engine.world;
  for (const fn of resetHooks) fn();
  return engine;
}

export function destroyWorld() {
  destroyEngine();
  engine = null;
  world = null;
}

export { jointEnds as constraintEnds } from './phys/facade.js';
