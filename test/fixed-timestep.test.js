import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTickLoop } from '../src/sim/tick-loop.js';
import { TICK_MS, MAX_CATCHUP } from '../src/sim/time.js';

// These four tests measure loop MECHANICS — how much wall time becomes how many
// fixed steps — so they pin the pace multiplier to 1. Production leaves `pace`
// defaulted to paceScale(), which is what makes slow-mo and hitstop change how
// fast ticks are consumed; a loop whose tick rate is deliberately variable
// cannot also be the thing that proves framerate independence.
const unpaced = (step) => createTickLoop({ step, pace: () => 1 });

test('a 16.7ms frame runs exactly one step', () => {
  let steps = 0;
  const loop = unpaced(() => steps++);
  assert.equal(loop.pump(TICK_MS).alpha, 0, 'a whole tick leaves nothing over');
  assert.equal(steps, 1);
  // and the leftover a partial frame DOES leave is what a renderer interpolates
  // across, so it has to be the real fraction and not a rounding of it
  assert.equal(loop.pump(TICK_MS / 2).steps, 0);
  assert.equal(loop.pump(0).alpha, 0.5);
});

test('a slow 100ms frame catches up with several fixed steps, never one big one', () => {
  const deltas = [];
  const loop = unpaced((dt) => deltas.push(dt));
  const r = loop.pump(100);
  // 100ms is exactly six ticks' worth — one more than MAX_CATCHUP allows — so
  // the sixth is shed rather than run. What DOES run is MAX_CATCHUP steps of
  // exactly TICK_MS, never a single 100ms lurch, which is the claim here.
  assert.equal(deltas.length, MAX_CATCHUP);
  assert.ok(deltas.every((d) => d === TICK_MS), 'every step is exactly TICK_MS');
  assert.ok(r.dropped > 0, 'the sixth tick is reported as dropped, not run late');
});

test('catch-up is capped and the shortfall is reported, not silently dropped', () => {
  const loop = unpaced(() => {});
  const r = loop.pump(1000);
  assert.equal(r.steps, MAX_CATCHUP);
  assert.ok(r.dropped > 0, 'dropped time is reported');
});

test('total steps over one simulated second is framerate independent', () => {
  const run = (fps) => {
    let steps = 0;
    const loop = unpaced(() => steps++);
    const dt = 1000 / fps;
    for (let i = 0; i < fps; i++) loop.pump(dt);
    return steps;
  };
  assert.equal(run(60), 60);
  assert.equal(run(144), 60);
  assert.equal(run(30), 60);
});
