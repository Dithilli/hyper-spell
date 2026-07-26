// schedule.js — the round-flow timers.
//
// Round flow still schedules respawns and next-rounds off the host's real
// timers; every handle is tracked so tearing a sim down flushes them instead of
// letting them fire into a destroyed world (server/shims.js:66 did this by
// wrapping setTimeout inside the sandbox). Task 6 replaces the wall clock here
// with tick-scheduled callbacks.
const timers = new Set();

export function schedule(fn, ms) {
  const h = setTimeout(() => { timers.delete(h); fn(); }, ms);
  timers.add(h);
  return h;
}

export function clearAllScheduled() {
  for (const h of timers) clearTimeout(h);
  timers.clear();
}
