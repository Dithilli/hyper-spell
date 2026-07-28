// The tick scheduler: the sim's round flow used to hang off the host's real
// setTimeout, which made "1900ms later" mean something different depending on
// how fast the machine drew frames, and made round transitions unreplayable.
// These tests pin the three properties the sim depends on: a callback lands on
// a tick computed from the timestep, the drain order is total (tick, then
// insertion), and a tag can retract a whole class of pending work.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  scheduleIn, scheduleAt, cancel, cancelTag, drainScheduled, clearAllScheduled, pendingCount,
} from '../src/sim/schedule.js';
import { resetTick, advanceTick, currentTick, ticks } from '../src/sim/time.js';

test('a callback fires on the tick it was scheduled for', () => {
  clearAllScheduled(); resetTick(0);
  let fired = -1;
  scheduleIn(650, () => { fired = currentTick(); });
  for (let i = 0; i < 60; i++) { drainScheduled(currentTick()); advanceTick(); }
  assert.equal(fired, ticks(650));
});

test('callbacks fire in tick order, then insertion order', () => {
  clearAllScheduled(); resetTick(0);
  const order = [];
  scheduleAt(3, () => order.push('b'));
  scheduleAt(2, () => order.push('a'));
  scheduleAt(3, () => order.push('c'));
  for (let i = 0; i <= 4; i++) { drainScheduled(currentTick()); advanceTick(); }
  assert.deepEqual(order, ['a', 'b', 'c']);
});

test('cancelTag drops every pending callback with that tag', () => {
  clearAllScheduled(); resetTick(0);
  let fired = 0;
  scheduleIn(100, () => fired++, 'round');
  scheduleIn(200, () => fired++, 'round');
  scheduleIn(300, () => fired++, 'other');
  cancelTag('round');
  assert.equal(pendingCount(), 1);
  for (let i = 0; i < 30; i++) { drainScheduled(currentTick()); advanceTick(); }
  assert.equal(fired, 1);
});

test('cancel drops exactly the one callback it names', () => {
  clearAllScheduled(); resetTick(0);
  const order = [];
  scheduleIn(100, () => order.push('a'));
  const id = scheduleIn(100, () => order.push('b'));
  scheduleIn(100, () => order.push('c'));
  cancel(id);
  assert.equal(pendingCount(), 2);
  for (let i = 0; i < 30; i++) { drainScheduled(currentTick()); advanceTick(); }
  assert.deepEqual(order, ['a', 'c']);
});

// A drain that fired everything due "so far" would make a sim that was paused,
// stepped in a burst, or restored from a tick in the past collapse a whole
// queue into one tick. That is correct for catch-up (the deadline HAS passed),
// so it is asserted rather than left to chance.
test('a late drain fires everything already due, in order', () => {
  clearAllScheduled(); resetTick(0);
  const order = [];
  scheduleAt(1, () => order.push('a'));
  scheduleAt(2, () => order.push('b'));
  scheduleAt(9, () => order.push('late'));
  drainScheduled(5);
  assert.deepEqual(order, ['a', 'b']);
  assert.equal(pendingCount(), 1);
});

// The round-flow callbacks reschedule (startRound cancels the 'round' tag and
// the next round-end queues a fresh one). A callback that schedules during the
// drain must not be run by the same drain, or a self-rescheduling callback
// would spin forever inside one tick.
test('a callback scheduled during a drain waits for its own tick', () => {
  clearAllScheduled(); resetTick(0);
  const order = [];
  scheduleAt(1, () => {
    order.push('outer');
    scheduleAt(1, () => order.push('inner')); // already due, but not this drain
  });
  drainScheduled(1);
  assert.deepEqual(order, ['outer']);
  assert.equal(pendingCount(), 1);
  drainScheduled(1);
  assert.deepEqual(order, ['outer', 'inner']);
});

// The round-flow case that motivates cancelTag: a callback cancels its own tag
// (startRound does) while a sibling with that tag is already in the same drain
// batch. The sibling has been pulled out of the pending queue by then, so a
// cancel that only filtered the queue would miss it — and "cancelled" would
// quietly mean "cancelled unless it was due on the same tick".
test('a callback cancelling its tag retracts siblings in the same drain', () => {
  clearAllScheduled(); resetTick(0);
  const order = [];
  scheduleAt(1, () => { order.push('first'); cancelTag('round'); }, 'round');
  scheduleAt(1, () => order.push('sibling'), 'round');
  scheduleAt(1, () => order.push('untagged'));
  drainScheduled(1);
  assert.deepEqual(order, ['first', 'untagged']);
});

test('cancel(id) from inside a drain retracts that one sibling', () => {
  clearAllScheduled(); resetTick(0);
  const order = [];
  let victim;
  scheduleAt(1, () => { order.push('a'); cancel(victim); });
  victim = scheduleAt(1, () => order.push('b'));
  scheduleAt(1, () => order.push('c'));
  drainScheduled(1);
  assert.deepEqual(order, ['a', 'c']);
});

// destroy() can run from inside a callback (a crashing sim tearing itself
// down); nothing else in that batch may fire into the world it just cleared.
test('clearAllScheduled from inside a drain stops the rest of the batch', () => {
  clearAllScheduled(); resetTick(0);
  const order = [];
  scheduleAt(1, () => { order.push('a'); clearAllScheduled(); });
  scheduleAt(1, () => order.push('b'));
  scheduleAt(1, () => order.push('c'));
  drainScheduled(1);
  assert.deepEqual(order, ['a']);
});

// clearAllScheduled is what src/platform/node.js's destroy() calls: a torn-down
// sim must not be able to fire anything into the world that replaced it.
test('clearAllScheduled empties the queue', () => {
  clearAllScheduled(); resetTick(0);
  let fired = 0;
  scheduleIn(100, () => fired++, 'round');
  scheduleAt(1, () => fired++);
  clearAllScheduled();
  assert.equal(pendingCount(), 0);
  for (let i = 0; i < 30; i++) { drainScheduled(currentTick()); advanceTick(); }
  assert.equal(fired, 0);
});
