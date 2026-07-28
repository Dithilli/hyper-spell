import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTickLoop } from '../src/sim/tick-loop.js';
import { createSim } from '../src/platform/node.js';
import { reseed } from '../src/sim/rng.js';
import { LEGACY_FRAME_MS, perSecond, perSecondAt, TICK_HZ, TICK_MS } from '../src/sim/time.js';

// Drive one simulated second of held-right input at three display rates. The
// wizard must end up in the same place: the loop already guarantees 60 steps,
// so this catches any force still applied per *frame* rather than per step.
function runOneSecond(fps) {
  reseed(31337);
  const { bridge, destroy } = createSim({});
  const slot = bridge.addPlayer({ name: 'A' });
  bridge.addPlayer({ name: 'B' });
  bridge.start();
  const loop = createTickLoop({ step: () => bridge.stepSim() });
  bridge.setInput(slot, { m: 1, j: 0, c: 0, c2: 0, b: 0, a: 0 });
  const dt = 1000 / fps;
  for (let i = 0; i < fps; i++) loop.pump(dt);
  const me = bridge.takeWireSnapshot().ps.find((p) => p.s === slot);
  destroy();
  return { x: me.x, vx: me.vx };
}

// The unit half of the same claim. A constant authored against a 60Hz frame
// says "this much velocity, sixty times a second"; the conversion must preserve
// that per-SECOND total at whatever rate the sim ticks. This is asserted at
// rates the sim does NOT run at on purpose: at TICK_MS the correct conversion,
// its reciprocal, and a bare `v => v` all return the same number, so a test
// evaluated only at 60Hz passes for every one of them and proves nothing.
const CANDIDATE_RATES_HZ = [30, 60, 72, 120, 144, 240];

test('perSecondAt preserves a constant\'s per-second total at any tick rate', () => {
  for (const v of [0.25, -0.9, 1.4, 0.35, 0.08]) {
    const authored = v * 60; // "v per frame, on the 60Hz display it was tuned against"
    for (const hz of CANDIDATE_RATES_HZ) {
      const total = perSecondAt(v, 1000 / hz) * hz;
      assert.ok(
        Math.abs(total - authored) < 1e-12,
        `${v} at ${hz}Hz totals ${total} per second, not the authored ${authored}`,
      );
    }
  }
});

test('perSecond is perSecondAt bound to the sim\'s own tick, and the identity at 60Hz', () => {
  // without this the shipped helper could drift from the one under test above
  for (const v of [0.25, -0.9, 1.4]) assert.equal(perSecond(v), perSecondAt(v, TICK_MS));
  assert.equal(LEGACY_FRAME_MS, 1000 / 60, 'the legacy frame the constants were authored against');
  assert.equal(TICK_HZ, 60, 'the identity below is only true while the sim ticks at 60Hz');
  assert.equal(perSecond(0.25), 0.25, 'a 60Hz player sees no change at all');
});

test('held movement covers the same ground at 30, 60 and 144 fps', () => {
  const a = runOneSecond(60);
  const b = runOneSecond(144);
  const c = runOneSecond(30);
  assert.ok(Math.abs(a.x - b.x) <= 1, `60fps x=${a.x} vs 144fps x=${b.x}`);
  assert.ok(Math.abs(a.x - c.x) <= 1, `60fps x=${a.x} vs 30fps x=${c.x}`);
});
