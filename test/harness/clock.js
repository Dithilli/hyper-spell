// A fake `performance` for the sim sandbox: time only moves when we say so.
export function makeClock(startMs = 0) {
  let t = startMs;
  return {
    now: () => t,
    advance: (ms) => { t += ms; },
  };
}
