import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runTape } from './harness/tape.js';
import { makeRng, reseed, simRandom } from '../src/sim/rng.js';
import { Composite } from '../src/sim/world.js';
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

test('reseed replaces the round stream without disturbing makeRng', () => {
  const seq = s => { const r = makeRng(s); return Array.from({ length: 32 }, r); };
  const before = seq(4242);
  reseed(999);
  for (let i = 0; i < 50; i++) simRandom();
  assert.deepEqual(seq(4242), before);
});
