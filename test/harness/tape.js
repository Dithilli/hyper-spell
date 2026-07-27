import { makeClock } from './clock.js';
import { seededRandom } from './seeded-random.js';
import { hashSnapshot } from './hash.js';
import { createSim } from '../../src/platform/node.js';
import { TICK_MS, advanceTick } from '../../src/sim/time.js';

// input tape format: { players: [{ name }], frames: [ { "0": {m,j,c,c2,b,a}, ... } ] }
// A frame index beyond the tape's length repeats the last frame.
export function runTape({ tape, ticks, seed = 12345 }) {
  const clock = makeClock(0);
  const sim = createSim({ clock, random: seededRandom(seed) });
  const b = sim.bridge;

  // destroy() in a finally: a throw mid-tick must still flush the sim's
  // scheduled timers and reset its seeded stream, or every later run in this
  // process inherits them. test/harness-hash.test.js does the same.
  try {
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
      // the platform loops advance the tick inside their step callback; this rig
      // is its own loop, so it owns that too. createSim() reset the counter, so
      // simNow() and this clock hold the same number all the way through — the
      // coherence Task 4 needs when it moves the sim's deadlines onto simNow().
      // Nothing in the sim reads simNow() yet, so this cannot move a hash; the
      // point is that the oracle stays honest when something does.
      advanceTick();
      clock.advance(TICK_MS);
      hashes.push(hashSnapshot(b.takeWireSnapshot(clock.now())));
    }
    return hashes;
  } finally {
    sim.destroy();
  }
}
