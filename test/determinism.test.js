import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runTape } from './harness/tape.js';
import { makeRng, reseed, simRandom } from '../src/sim/rng.js';
import { Bodies, Composite, createWorld, destroyWorld } from '../src/sim/world.js';
import { addStatic } from '../src/sim/maps/builders.js';
import { buildMapExtras } from '../src/sim/maps/extras.js';

const tape = JSON.parse(readFileSync('test/tape/one-round.input.json', 'utf8'));

// The sim owns its stream now: nothing is injected, so these two properties are
// the whole contract. If the first fails the sim is reading entropy from
// somewhere the seed cannot reach; if the second fails the seed reaches nothing.
test('the same seed produces an identical run', () => {
  const a = runTape({ tape, ticks: 300, seed: 4242 });
  const b = runTape({ tape, ticks: 300, seed: 4242 });
  assert.deepEqual(a, b, 'same seed must produce an identical run');
});

test('different seeds produce different runs', () => {
  const a = runTape({ tape, ticks: 300, seed: 1 });
  const b = runTape({ tape, ticks: 300, seed: 2 });
  assert.notDeepEqual(a, b, 'the seed must actually influence the sim');
});

// makeRng's other job: a LAN host and its clients build the same post-build map
// extras from the shared per-round seed, and static bodies never ride the
// snapshot — so a client whose global stream sits at a different offset than the
// host's must still generate byte-identical geometry. The two must not couple.
function extrasFingerprint(seed) {
  const m = { def: { cover: 'pillar' }, composite: Composite.create(), data: {} };
  addStatic(m, 150, 500, 260, 24, {});   // two ledges with a void too wide to
  addStatic(m, 760, 460, 260, 24, {});   // clear — forces steppers, props, cover
  buildMapExtras(m, seed);
  return Composite.allBodies(m.composite).map(
    b => `${b.label}|${b.position.x.toFixed(9)}|${b.position.y.toFixed(9)}|${b.area.toFixed(9)}`,
  );
}

test('map extras derive from the map seed alone, not the round stream', () => {
  reseed(1);
  const host = extrasFingerprint(0xc0ffee);
  assert.ok(host.length > 10, 'the fixture must actually generate extras');

  // a client at a wildly different point in its own round stream
  reseed(987654321);
  for (let i = 0; i < 137; i++) simRandom();
  assert.deepEqual(extrasFingerprint(0xc0ffee), host, 'extras must not read the round stream');

  // and a different map seed must still change them
  reseed(1);
  assert.notDeepEqual(extrasFingerprint(0xbadbad), host, 'the map seed must reach the extras');
});

// src/sim/rng.js is not the only stream the sim draws from: matter-js keeps its
// own process-global one (Common._seed) and Body.create takes a number from it
// for EVERY non-static body, to pick a default fillStyle before the caller's
// colour overrides it. A body we never colour — a Crate Drop crate — therefore
// inherited a colour that depended on how many bodies the process had built
// before it, so a second sim in one process disagreed with the first about what
// rode the wire. createWorld() resets it, and this pins that: the churn between
// the two worlds is what a real prior match does.
test('a rebuilt world starts matter-js own RNG where the first one did', () => {
  const uncoloured = () => Bodies.rectangle(0, 0, 10, 10).render.fillStyle;
  const seen = [];
  for (let run = 0; run < 2; run++) {
    createWorld();
    seen.push(uncoloured());
    for (let i = 0; i < 137; i++) uncoloured(); // a match's worth of bodies
    destroyWorld();
  }
  assert.equal(seen[0], seen[1], 'matter-js default colours leaked across worlds');
});

test('reseed replaces the round stream without disturbing makeRng', () => {
  const seq = s => { const r = makeRng(s); return Array.from({ length: 32 }, r); };
  const before = seq(4242);
  reseed(999);
  for (let i = 0; i < 50; i++) simRandom();
  assert.deepEqual(seq(4242), before);
});
