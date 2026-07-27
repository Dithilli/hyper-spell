import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTickLoop } from '../src/sim/tick-loop.js';
import { createSim } from '../src/platform/node.js';
import { reseed } from '../src/sim/rng.js';
import { perSecond, TICK_HZ, TICK_MS } from '../src/sim/time.js';

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
// says "this much velocity, sixty times a second". perSecond() must preserve
// that per-SECOND total for whatever tick rate the sim actually runs at, which
// is exactly what makes it the identity while TICK_HZ is 60.
test('perSecond preserves the per-second total and is the identity at 60Hz', () => {
  const LEGACY_FRAME_MS = 1000 / 60;
  for (const v of [0.25, -0.9, 1.4, 0.35]) {
    const perSecondTotal = v * 1000 / LEGACY_FRAME_MS;
    assert.ok(Math.abs(perSecond(v) * TICK_HZ - perSecondTotal) < 1e-12, `${v} keeps its per-second total`);
    assert.equal(perSecond(v), v * (TICK_MS / LEGACY_FRAME_MS));
  }
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
