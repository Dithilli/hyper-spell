import { makeClock } from './clock.js';
import { seededRandom } from './seeded-random.js';
import { hashSnapshot } from './hash.js';
import { createSim } from '../../src/platform/node.js';
import { TICK_MS } from '../../src/sim/time.js';

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
      b.stepSim(); // takes nothing, steps TICK_MS, and advances the tick itself
      // The injected env clock is walked alongside the tick so it holds the same
      // number simNow() does. Nothing under src/sim reads it any more, but
      // src/net/server-bridge.js still does — its wire-input staleness window is
      // a real-time concern — and a frozen clock there would silently change
      // which inputs the tape counts as fresh.
      clock.advance(TICK_MS);
      hashes.push(hashSnapshot(b.takeWireSnapshot()));
    }
    return hashes;
  } finally {
    sim.destroy();
  }
}
