import { readFileSync, writeFileSync } from 'node:fs';
import { runTape } from './tape.js';

const tape = JSON.parse(readFileSync('test/tape/one-round.input.json', 'utf8'));
const hashes = runTape({ tape, ticks: 600, seed: 12345 });
writeFileSync('test/tape/one-round.golden.json', JSON.stringify({ ticks: 600, seed: 12345, hashes }, null, 0) + '\n');
console.log(`recorded ${hashes.length} tick hashes; last = ${hashes.at(-1)}`);
