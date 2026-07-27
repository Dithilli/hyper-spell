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
let entries = []; // { at, id, fn, tag, cancelled? }

// The batch drainScheduled is part-way through running, or null. Callbacks
// routinely cancel each other (startRound cancels the whole 'round' tag), and a
// sibling already pulled out of `entries` for this drain is not reachable
// through `entries` any more — so cancel/cancelTag/clearAllScheduled reach in
// here too. Without it, "cancelled" would silently mean "cancelled unless it
// happened to be due on the same tick as whoever cancelled it".
let running = null;

export function scheduleAt(at, fn, tag = null) {
  const id = ++seq;
  entries.push({ at, id, fn, tag });
  return id;
}

// Content authors durations in milliseconds; ticks() is the one place that
// becomes a step count.
export const scheduleIn = (ms, fn, tag = null) => scheduleAt(currentTick() + ticks(ms), fn, tag);

const retract = (match) => {
  entries = entries.filter((e) => !match(e));
  if (running) for (const e of running) if (match(e)) e.cancelled = true;
};

export function cancel(id) { retract((e) => e.id === id); }
export function cancelTag(tag) { retract((e) => e.tag === tag); }
export function clearAllScheduled() { retract(() => true); }
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
  // `running` is what lets a cancel from inside one of these callbacks reach
  // its siblings; the `cancelled` re-check is per iteration because the entry
  // that retracts a later one may be several callbacks up the list. Saved and
  // restored rather than nulled, so a nested drain cannot orphan the outer one.
  const outer = running;
  running = due;
  try {
    for (const e of due) if (!e.cancelled) e.fn();
  } finally {
    running = outer;
  }
}

// The queue is mutable sim state like any other: a rebuilt world (the crash
// watchdog in server/sim-host.js, a second createSim in one process) starts
// with nothing pending, exactly as the first one did.
onWorldReset(() => { entries = []; running = null; });
