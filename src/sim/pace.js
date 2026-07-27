// pace.js — the game's master tempo and its hitstop.
//
// slowMo is the one cosmetic that is also simulation, so the server both calls
// it and broadcasts it. What it scales changed with the fixed timestep: it used
// to shrink the timestep handed to the solver (a 0.05 hitstop meant an 0.8ms
// Engine.update), which made physics resolution a function of spectacle. Now it
// scales how fast the tick loop CONSUMES real time — the steps themselves are
// always exactly TICK_MS. See src/sim/tick-loop.js.
// The deadline below stays on the env clock, NOT on simNow(). Every one of the
// 14 slowMo call sites authors `ms` as a real-world duration, and simNow() is
// the clock this very hitstop slows down — measuring the deadline there makes
// the beat last ms/scale and feed back on itself (a 90ms freeze at 0.05 held
// the sim for two seconds). It is the same two-clock error that keeps stepSim
// on the host clock in this task; Task 4 moves the whole sim across at once.
import { performance } from './env.js';
import { onWorldReset } from './world.js';

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

function baseSlowMo(s, ms) { scale = Math.max(MIN_PACE, s); slowUntil = performance.now() + ms; }

// slowMo stays a reassignable binding: src/net/server-bridge.js wraps it so a
// headless host broadcasts the hitstop to every client (see WRAPPED there).
export let slowMo = baseSlowMo;
export function setSlowMo(fn) { slowMo = fn; }

export function updatePace() {
  if (performance.now() > slowUntil) scale += (BASE_PACE - scale) * 0.08; // ease back to the base pace, not full speed
}

onWorldReset(() => { scale = BASE_PACE; slowUntil = 0; });
