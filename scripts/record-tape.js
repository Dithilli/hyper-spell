#!/usr/bin/env node
// record-tape.js — (re)record the golden per-tick hashes for the input tape.
//
// This lives outside test/ on purpose. A bare `node --test` (and most IDE test
// runners) sweeps in every file under test/, which would execute the recorder
// and silently rewrite the very baseline test/golden-tape.test.js checks
// against — leaving the regression test passing vacuously forever.
//
//   npm run tape:record
import { readFileSync, writeFileSync } from 'node:fs';
import { runTape } from '../test/harness/tape.js';

const TICKS = 600;
const SEED = 12345;

const tape = JSON.parse(readFileSync('test/tape/one-round.input.json', 'utf8'));
const hashes = runTape({ tape, ticks: TICKS, seed: SEED });
writeFileSync('test/tape/one-round.golden.json', JSON.stringify({ ticks: TICKS, seed: SEED, hashes }, null, 0) + '\n');
console.log(`recorded ${hashes.length} tick hashes; last = ${hashes.at(-1)}`);
