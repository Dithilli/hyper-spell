// emit.test.js — the cosmetic event queue (src/sim/emit.js).
//
// This is the connective piece between "the sim decided something looks a
// certain way" and "somebody drew it", and connective pieces are where this
// plan has repeatedly found tests that pass for the wrong reason. So the queue
// is tested for the three things a queue can silently get wrong — losing an
// event, reordering events, and handing the same event out twice — rather than
// for the existence of its functions.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emit, drainEmitted, emittedCount } from '../src/sim/emit.js';
import { createWorld, destroyWorld } from '../src/sim/world.js';

function fresh() { drainEmitted(); }

test('an emission is queued in the wire shape', () => {
  fresh();
  emit('spawnParticles', 10, 20, '#fff', 6, 3);
  assert.deepEqual(drainEmitted(), [{ f: 'spawnParticles', a: [10, 20, '#fff', 6, 3] }]);
});

test('every emission survives the drain, in order', () => {
  fresh();
  // A dropped event is the failure that looks most like success: the picture
  // is merely a bit quieter. Count and order are both asserted so neither a
  // silent drop nor a queue that reverses can slip through.
  const names = ['doFlash', 'spawnRing', 'addShake', 'spawnText', 'sfx'];
  for (const n of names) emit(n, n);
  assert.equal(emittedCount(), names.length);
  const out = drainEmitted();
  assert.equal(out.length, names.length);
  assert.deepEqual(out.map((e) => e.f), names);
});

test('drain empties the queue, so nothing is delivered twice', () => {
  fresh();
  emit('addShake', 4);
  assert.equal(emittedCount(), 1);
  assert.equal(drainEmitted().length, 1);
  assert.equal(emittedCount(), 0);
  assert.deepEqual(drainEmitted(), []);
});

test('an emission with no arguments keeps an empty argument list', () => {
  fresh();
  emit('clearParticles');
  assert.deepEqual(drainEmitted(), [{ f: 'clearParticles', a: [] }]);
});

test('a world reset drops events queued for the world that just went away', () => {
  fresh();
  emit('spawnParticles', 1, 2, '#fff', 1, 1);
  createWorld(); // runs every module's reset hook, emit.js's included
  assert.equal(emittedCount(), 0, 'stale cosmetics leaked into the next world');
  destroyWorld();
});
