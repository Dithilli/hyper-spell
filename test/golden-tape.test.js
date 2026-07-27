import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runTape, runTapeWithRounds } from './harness/tape.js';

const tape = JSON.parse(readFileSync('test/tape/one-round.input.json', 'utf8'));
const golden = JSON.parse(readFileSync('test/tape/one-round.golden.json', 'utf8'));
const long = JSON.parse(readFileSync('test/tape/three-rounds.input.json', 'utf8'));
const longGolden = JSON.parse(readFileSync('test/tape/three-rounds.golden.json', 'utf8'));

test('the golden tape replays to identical per-tick hashes', () => {
  const hashes = runTape({ tape, ticks: golden.ticks, seed: golden.seed });
  assert.equal(hashes.length, golden.hashes.length);
  const firstDivergence = hashes.findIndex((h, i) => h !== golden.hashes[i]);
  assert.equal(firstDivergence, -1, `diverged at tick ${firstDivergence}`);
});

test('the same seed twice produces the same run', () => {
  const a = runTape({ tape, ticks: 120, seed: 999 });
  const b = runTape({ tape, ticks: 120, seed: 999 });
  assert.deepEqual(a, b);
});

// Without this, a sim frozen into doing nothing would satisfy the reproducibility
// test above just as well as a working one: the seed has to actually reach the
// sim's round stream (src/sim/rng.js) and change what the run does.
test('a different seed produces a different run', () => {
  const a = runTape({ tape, ticks: 120, seed: 999 });
  const b = runTape({ tape, ticks: 120, seed: 424242 });
  assert.notDeepEqual(a, b);
});

// The one-round tape never resolves a round, so it cannot see round flow at
// all. This one does: it dies, plays the killcam, runs the tick-scheduled
// round-end resolution and loads a new map, four times over.
test('a three-round tape replays identically across round boundaries', () => {
  const hashes = runTape({ tape: long, ticks: longGolden.ticks, seed: longGolden.seed });
  assert.equal(hashes.length, longGolden.hashes.length);
  const d = hashes.findIndex((h, i) => h !== longGolden.hashes[i]);
  assert.equal(d, -1, `diverged at tick ${d}`);
});

test('the long tape really does cross round boundaries', () => {
  // Guards against a tape that silently never leaves round 1 — which would
  // make the test above pass while proving nothing about round flow. It is not
  // hypothetical: the first draft of the input pattern left both wizards
  // oscillating on their spawn points, unarmed, for the whole run.
  const { rounds } = runTapeWithRounds({ tape: long, ticks: longGolden.ticks, seed: longGolden.seed });
  assert.ok(rounds >= 3, `expected at least 3 rounds, saw ${rounds}`);
});

// ...and the guard above has to be capable of failing. The short tape is a real
// run of the same harness that genuinely never leaves round 1, so it shows the
// assertion discriminates rather than always holding.
test('the round-crossing guard fails on a tape that stays in round one', () => {
  const { rounds } = runTapeWithRounds({ tape, ticks: golden.ticks, seed: golden.seed });
  assert.equal(rounds, 1, 'the short tape started crossing rounds — pick another negative case');
});
