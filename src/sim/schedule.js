// schedule.js — the sim's own timer queue, measured in ticks.
//
// Round flow (respawns, the round-end resolution, the next round after a boss)
// used to hang off the host's real setTimeout. That made every one of those
// deadlines a wall-clock promise inside a simulation whose only clock is
// simNow(): a hitstop slowed the game but not the timer, a paused or
// fast-forwarded sim ran its round flow at real speed regardless, and a replay
// of the same inputs could not reproduce a round transition because the
// transition was not part of the input.
//
// Deadlines now live on the tick counter. `drainScheduled(currentTick())` is
// the first thing stepSim does, so a callback runs at the top of the tick it
// was due on, before anything else observes that tick — one clock for the
// deadline, the killcam tape and every content deadline alike.
//
// clearAllScheduled() survives from the setTimeout version because
// src/platform/node.js's destroy() calls it: a torn-down sim must not be able
// to fire anything into the world that replaced it.
import { currentTick, ticks } from './time.js';
import { onWorldReset } from './world.js';

// Monotonic and never reset, not even by clearAllScheduled(). Ids are handles
// callers may hold across a clear, and recycling them would let a stale
// cancel(id) retract an unrelated callback.
let seq = 0;
let entries = []; // { at, id, fn, tag }

export function scheduleAt(at, fn, tag = null) {
  const id = ++seq;
  entries.push({ at, id, fn, tag });
  return id;
}

// Content authors durations in milliseconds; ticks() is the one place that
// becomes a step count.
export const scheduleIn = (ms, fn, tag = null) => scheduleAt(currentTick() + ticks(ms), fn, tag);

export function cancel(id) { entries = entries.filter((e) => e.id !== id); }
export function cancelTag(tag) { entries = entries.filter((e) => e.tag !== tag); }
export function clearAllScheduled() { entries = []; }
export const pendingCount = () => entries.length;

export function drainScheduled(tick) {
  if (!entries.length) return;
  // Tick order first, then insertion order. Sorting rather than trusting array
  // position is what keeps the drain deterministic when cancel()/cancelTag()
  // have churned the array, and when a late drain (a paused sim resuming) has
  // several ticks' worth due at once.
  const due = entries.filter((e) => e.at <= tick).sort((a, b) => a.at - b.at || a.id - b.id);
  if (!due.length) return;
  // Removed BEFORE anything runs, so a callback that schedules (round flow
  // reschedules constantly) lands in the queue for a later drain instead of
  // being swept into this one — a self-rescheduling callback must not spin
  // inside a single tick.
  const dueIds = new Set(due.map((e) => e.id));
  entries = entries.filter((e) => !dueIds.has(e.id));
  for (const e of due) e.fn();
}

// The queue is mutable sim state like any other: a rebuilt world (the crash
// watchdog in server/sim-host.js, a second createSim in one process) starts
// with nothing pending, exactly as the first one did.
onWorldReset(() => { entries = []; });
