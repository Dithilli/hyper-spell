import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runTape } from './harness/tape.js';

const tape = JSON.parse(readFileSync('test/tape/one-round.input.json', 'utf8'));
const golden = JSON.parse(readFileSync('test/tape/one-round.golden.json', 'utf8'));

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
