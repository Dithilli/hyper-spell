import { makeClock } from './clock.js';
import { hashSnapshot } from './hash.js';
import { createSim } from '../../src/platform/node.js';
import { reseed } from '../../src/sim/rng.js';
import { TICK_MS } from '../../src/sim/time.js';

// input tape format: { players: [{ name }], frames: [ { "0": {m,j,c,c2,b,a}, ... } ] }
// A frame index beyond the tape's length repeats the last frame.
// onTick(bridge) runs after every stepSim, before the snapshot is hashed — the
// hook runTapeWithRounds uses to observe what the run actually did.
export function runTape({ tape, ticks, seed = 12345, onTick = null }) {
  const clock = makeClock(0);
  // The sim owns its randomness; there is nothing to inject. Seeding happens
  // BEFORE createSim because createSim's loadMap(0) already draws the first map
  // seed off the stream, and that draw is part of the run the tape hashes.
  reseed(seed);
  const sim = createSim({ clock });
  const b = sim.bridge;

  // destroy() in a finally: a throw mid-tick must still flush the sim's pending
  // scheduled callbacks, or every later run in this process inherits them.
  // The stream needs no unwinding — every run reseeds it on the way in.
  // test/harness-hash.test.js does the same.
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
      onTick?.(b);
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

// runTape with a report of how far the run actually got. A tape that silently
// never leaves round 1 would satisfy a hash-comparison test just as well as one
// that crosses three round boundaries, and prove nothing about round flow —
// test/golden-tape.test.js asserts on `rounds` so the long tape has to earn its
// name. `bridge.round()` is game.totalRounds, which startRound increments.
export function runTapeWithRounds(opts) {
  let maxRound = 0;
  const hashes = runTape({ ...opts, onTick: (bridge) => { maxRound = Math.max(maxRound, bridge.round()); } });
  return { hashes, rounds: maxRound };
}
