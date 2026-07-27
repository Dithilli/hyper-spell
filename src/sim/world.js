// world.js — the physics engine, the arena's dimensions, and the one place a
// pristine simulation is built.
//
// This module is a leaf on purpose: it imports nothing but matter-js, so the
// constants below are always initialised before any other sim module's body
// runs. Modules that own mutable state register a reset hook here; createWorld()
// runs them all, which is what lets a second createSim() in the same process
// start from exactly the state the first one did (the vm sandbox used to get
// that for free from a fresh global scope).
import Matter from 'matter-js';

export const { Common, Engine, Bodies, Body, Composite, Constraint, Events, Query, Vector } = Matter;

export const W = 1280, H = 720;

export let engine = null;
export let world = null;

const resetHooks = [];

// Register a callback that returns a module's mutable state to its initial
// value. Hooks must not depend on each other's ordering.
export function onWorldReset(fn) { resetHooks.push(fn); }

export function createWorld() {
  // matter-js keeps ONE process-global RNG, Common._seed, and Body.create draws
  // from it for every non-static body: `Common.choose([...])` picks a default
  // fillStyle before the caller's colour (if any) overrides it. So the stream
  // advances once per body created anywhere in the process, forever, and a body
  // we DON'T colour — a Crate Drop crate is the live example — takes whatever
  // that stream happens to be on. That made the wire colour of such a body a
  // function of how much simulation had already run in the process: a second
  // createSim() reproduced its predecessor's positions exactly and disagreed on
  // the colour. Resetting it here is the same contract as the reset hooks below
  // — a rebuilt world starts where the first one did — and it is the last piece
  // of the sim's randomness that the seed did not reach (see src/sim/rng.js).
  Common._seed = 0;
  engine = Engine.create();
  engine.gravity.y = 2;
  world = engine.world;
  for (const fn of resetHooks) fn();
  return engine;
}

export function destroyWorld() {
  if (engine) {
    Composite.clear(world, false);
    Engine.clear(engine);
  }
  engine = null;
  world = null;
}

export function constraintEnds(c) {
  const a = c.bodyA ? Vector.add(c.bodyA.position, Vector.rotate(c.pointA, c.bodyA.angle)) : c.pointA;
  const b = c.bodyB ? Vector.add(c.bodyB.position, Vector.rotate(c.pointB, c.bodyB.angle)) : c.pointB;
  return [a, b];
}
