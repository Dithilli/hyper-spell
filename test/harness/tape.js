import { createRequire } from 'node:module';
import { makeClock } from './clock.js';
import { seededRandom } from './seeded-random.js';
import { hashSnapshot } from './hash.js';

const require = createRequire(import.meta.url);
const { createSimContext } = require('../../server/sim-context.js');

const TICK_MS = 1000 / 60;

// input tape format: { players: [{ name }], frames: [ { "0": {m,j,c,c2,b,a}, ... } ] }
// A frame index beyond the tape's length repeats the last frame.
export function runTape({ tape, ticks, seed = 12345 }) {
  const clock = makeClock(0);
  const sim = createSimContext({ clock, random: seededRandom(seed) });
  const b = sim.bridge;

  const slots = tape.players.map((p) => b.addPlayer({ name: p.name }));
  b.start();

  const hashes = [];
  for (let i = 0; i < ticks; i++) {
    const frame = tape.frames[Math.min(i, tape.frames.length - 1)];
    for (const slot of slots) {
      const msg = frame?.[String(slot)];
      if (msg) b.setInput(slot, msg);
    }
    b.stepSim(clock.now(), TICK_MS);
    clock.advance(TICK_MS);
    hashes.push(hashSnapshot(b.takeWireSnapshot(clock.now())));
  }
  sim.destroy();
  return hashes;
}
