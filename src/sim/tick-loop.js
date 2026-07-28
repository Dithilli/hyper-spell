// tick-loop.js — the fixed-timestep accumulator.
//
// Real frames arrive whenever the display feels like it (16.7ms at 60Hz, 6.9ms
// at 144Hz, 40ms when the tab is busy). The solver must not see any of that:
// it gets exactly TICK_MS every time, and a fast display simply gets more
// frames drawn between the same 60 steps per second.
import { TICK_MS, MAX_CATCHUP } from './time.js';
import { paceScale } from './pace.js';

// TICK_MS is 16.666…, which no binary double represents exactly, so summing
// real frame deltas leaves residue: 144 pumps of 1000/144 land 8e-14 ms short
// of the 60th step and the loop silently runs 59. A tolerance of a femtosecond
// is many orders below any real timing quantum — it can only ever absorb that
// arithmetic dust, never a frame that genuinely fell short.
const STEP_EPS = 1e-9;

// `pace` is injected so the loop's own mechanics can be measured against a
// pace of 1 (test/fixed-timestep.test.js). Production takes the default and
// keeps the game's real tempo.
export function createTickLoop({ step, pace = paceScale }) {
  let accumulator = 0;
  return {
    pump(realDtMs) {
      // slow-mo and hitstop live HERE — they change how fast ticks are
      // consumed, never the size of a step
      accumulator += Math.min(realDtMs, 250) * pace();
      let steps = 0;
      while (accumulator >= TICK_MS - STEP_EPS && steps < MAX_CATCHUP) {
        step(TICK_MS);
        accumulator -= TICK_MS;
        steps++;
      }
      if (accumulator < 0) accumulator = 0; // the epsilon's change, never owed forward
      let dropped = 0;
      if (accumulator >= TICK_MS - STEP_EPS) {
        dropped = accumulator;
        accumulator = 0; // shed the backlog, but report it
      }
      return { steps, alpha: accumulator / TICK_MS, dropped };
    },
  };
}
