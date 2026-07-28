// pace.js — the game's master tempo and its hitstop.
//
// slowMo is the one cosmetic that is also simulation, so the server both calls
// it and broadcasts it. What it scales changed with the fixed timestep: it used
// to shrink the timestep handed to the solver (a 0.05 hitstop meant an 0.8ms
// physStep), which made physics resolution a function of spectacle. Now it
// scales how fast the tick loop CONSUMES real time — the steps themselves are
// always exactly TICK_MS. See src/sim/tick-loop.js.
// THE ONE DELIBERATE EXCEPTION to "simNow() is the sim's only clock".
//
// The deadline below stays on the env clock. Every one of the 14 slowMo call
// sites authors `ms` as a real-world duration — slowMo(0.05, 90) means 90ms as
// the player experiences it — and simNow() is the clock this very hitstop slows
// down. Measuring the deadline there makes the real duration ms/scale and feeds
// back on itself: a 90ms freeze at 0.05 held the sim for 2000ms (22x), and a
// 1.1s boss slam for 4.47s. `slowUntil = simNow() + ms * scale` does not fix it
// either, because updatePace eases `scale` mid-beat.
//
// Put another way: pace is a real-time concern BY DEFINITION. It is the thing
// that makes sim time diverge from real time, so it is the one thing that
// cannot be measured on sim time. test/fixed-timestep.test.js pins this, and
// test/module-boundaries.test.js carries a named exemption for this file.
import { performance } from './env.js';
import { onWorldReset } from './world.js';
import { emit } from './emit.js';

// master game pace: 1 = original, <1 = calmer & more readable so the spectacle
// (combos, fusions, big spells) registers instead of flashing by. Tune to taste.
export const BASE_PACE = 0.85;

// The slowest pace slowMo will honour, and the floor content already uses —
// spells/starters.js:61 and spells/book.js:243 are the two 0.05 sites, and
// nothing asks for less. It is a clamp rather than a comment because applyFx
// hands msg.a straight to slowMo (src/net/client.js:256,266) from a table whose
// job is surviving a bug or a hostile server, and a pace of exactly 0 is
// unrecoverable under the fixed timestep: the accumulator gains nothing, so the
// step never fires, so updatePace never runs and the pace can never climb back.
// (Before Task 3 that self-healed — the ease ran per frame inside stepSim, not
// per tick.) Clamping here covers the host and the client alike: server-bridge
// wraps slowMo to broadcast, then calls this, and the receiving client clamps
// the relayed value again on its own way in.
const MIN_PACE = 0.05;

// Starts AT the base pace rather than easing down from 1. The old `= 1` was a
// leftover from before BASE_PACE existed, and it meant every fresh world ran
// ~15% fast for its first second. Harmless when it only scaled dt; as a tick-
// consumption rate it would make a just-rebuilt server outrun its own 60Hz.
let scale = BASE_PACE;
let slowUntil = 0;

export const paceScale = () => scale;

// THE DUAL PATH, and the one cosmetic that keeps it.
//
// Every other cosmetic left the sim entirely in task 13: the sim emits, and
// somebody else decides what it looks like. slowMo cannot, because a hitstop is
// not only spectacle — it changes how fast the tick loop consumes real time, so
// the sim itself has to apply it or a headless host would run at full speed
// while every client crawled. So it does both, in this order: emit first, then
// apply, exactly as the old server-side wrapper did (`emitFx(name, args);
// return orig(...args)`), so the event a client receives is still ordered
// against its neighbours the same way.
//
// Deleting either half is a live bug and test/emit-apply.test.js pins both: the
// emit alone leaves a LAN host at full pace, the apply alone leaves every LAN
// client at full pace. src/render/fx.js's handler for 'slowMo' is deliberately
// a no-op — the couch sim already applied it here, on the way past.
export function slowMo(s, ms) {
  emit('slowMo', s, ms);
  scale = Math.max(MIN_PACE, s);
  slowUntil = performance.now() + ms;
}

export function updatePace() {
  if (performance.now() > slowUntil) scale += (BASE_PACE - scale) * 0.08; // ease back to the base pace, not full speed
}

onWorldReset(() => { scale = BASE_PACE; slowUntil = 0; });
