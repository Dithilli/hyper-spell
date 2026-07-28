import { readFileSync } from 'node:fs';
import { runTapeWithRounds } from './test/harness/tape.js';
const tape = JSON.parse(readFileSync('test/tape/three-rounds.input.json', 'utf8'));
const lo = Number(process.argv[2]), hi = Number(process.argv[3]);
const out = [];
for (let s = lo; s <= hi; s++) out.push(runTapeWithRounds({ tape, ticks: 4200, seed: s }).rounds);
const mean = out.reduce((a, b) => a + b, 0) / out.length;
console.log(out.join(' '));
console.log(`n=${out.length} mean=${mean.toFixed(3)} min=${Math.min(...out)} max=${Math.max(...out)}`);
