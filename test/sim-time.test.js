import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSim } from '../src/platform/node.js';
import { makeClock } from './harness/clock.js';
import { seededRandom } from './harness/seeded-random.js';
import { TICK_MS, simNow } from '../src/sim/time.js';

// A freeze declared as 1500ms must last 1500ms of GAME time, even when the
// pace drops to 0.3 for hitstop. Under the old two-clock model it expired in
// roughly a third of that.
test('status durations are unaffected by hitstop', async () => {
  const { bridge, destroy } = createSim({ clock: makeClock(0), random: seededRandom(7) });
  const slot = bridge.addPlayer({ name: 'A' });
  bridge.addPlayer({ name: 'B' });
  bridge.start();

  // stepSim() takes no arguments after Step 5 of this task
  const frozenTicksAtPace = (pace) => {
    bridge.debugFreeze(slot, 1500);
    bridge.debugSetPace(pace);
    let n = 0;
    while (bridge.debugIsFrozen(slot) && n < 400) { bridge.stepSim(); n++; }
    return n;
  };

  const atFullPace = frozenTicksAtPace(1);
  const atHitstop = frozenTicksAtPace(0.3);
  assert.equal(atFullPace, atHitstop, 'freeze lasts the same number of ticks at any pace');
  assert.ok(Math.abs(atFullPace - 90) <= 1, `1500ms is ~90 ticks, got ${atFullPace}`);
  destroy();
});

// The serializer is a sim function called from the net layer, which used to
// hand it the host's wall clock. Every status flag and cooldown fraction on the
// wire is a deadline comparison, so if it reads a different clock than the sim
// writes, a LAN client sees nobody frozen and every spell off cooldown — and
// the drift grows with uptime, which no short test would catch. Pinning the env
// clock somewhere far from tick 0 makes the two clocks impossible to confuse.
test('the wire snapshot reads the same clock the sim writes its deadlines on', () => {
  const { bridge, destroy } = createSim({ clock: makeClock(500_000), random: seededRandom(3) });
  try {
    const slot = bridge.addPlayer({ name: 'A' });
    bridge.addPlayer({ name: 'B' });
    bridge.start();
    const frozenOnWire = () => !!bridge.takeWireSnapshot().ps.find((p) => p.s === slot)?.fz;

    bridge.debugFreeze(slot, 1500);
    bridge.stepSim();
    assert.ok(frozenOnWire(), 'a live freeze rides the wire as fz:1');

    for (let i = 0; i < 95; i++) bridge.stepSim(); // past 1500ms of SIM time
    assert.ok(!bridge.debugIsFrozen(slot), 'the sim considers the freeze over');
    assert.ok(!frozenOnWire(), 'and so does the wire');
  } finally {
    destroy();
  }
});

// The whole point of the swap: a bare stepSim() loop advances the sim's clock
// by exactly one tick, and the env clock it used to read need never move at
// all. If any deadline were still written on the env clock this loop would
// hang on it forever, which is what the 400-tick ceiling above catches.
test('simNow advances one tick per stepSim, independently of the host clock', () => {
  const clock = makeClock(1_000_000); // a host clock that is nowhere near tick 0…
  const { bridge, destroy } = createSim({ clock, random: seededRandom(7) });
  try {
    bridge.addPlayer({ name: 'A' });
    bridge.addPlayer({ name: 'B' });
    bridge.start();
    const before = simNow();
    for (let i = 0; i < 10; i++) bridge.stepSim(); // …and never advances
    assert.equal(simNow() - before, 10 * TICK_MS);
    assert.equal(clock.now(), 1_000_000, 'the sim did not need the host clock to move');
  } finally {
    destroy();
  }
});
