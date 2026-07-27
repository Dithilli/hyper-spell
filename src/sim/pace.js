// pace.js — the game's master tempo and its hitstop.
//
// slowMo is the one cosmetic that is also simulation, so the server both calls
// it and broadcasts it. What it scales changed with the fixed timestep: it used
// to shrink the timestep handed to the solver (a 0.05 hitstop meant an 0.8ms
// Engine.update), which made physics resolution a function of spectacle. Now it
// scales how fast the tick loop CONSUMES real time — the steps themselves are
// always exactly TICK_MS. See src/sim/tick-loop.js.
import { simNow } from './time.js';
import { onWorldReset } from './world.js';

// master game pace: 1 = original, <1 = calmer & more readable so the spectacle
// (combos, fusions, big spells) registers instead of flashing by. Tune to taste.
export const BASE_PACE = 0.85;

// Starts AT the base pace rather than easing down from 1. The old `= 1` was a
// leftover from before BASE_PACE existed, and it meant every fresh world ran
// ~15% fast for its first second. Harmless when it only scaled dt; as a tick-
// consumption rate it would make a just-rebuilt server outrun its own 60Hz.
let scale = BASE_PACE;
let slowUntil = 0;

export const paceScale = () => scale;

function baseSlowMo(s, ms) { scale = s; slowUntil = simNow() + ms; }

// slowMo stays a reassignable binding: src/net/server-bridge.js wraps it so a
// headless host broadcasts the hitstop to every client (see WRAPPED there).
export let slowMo = baseSlowMo;
export function setSlowMo(fn) { slowMo = fn; }

export function updatePace() {
  if (simNow() > slowUntil) scale += (BASE_PACE - scale) * 0.08; // ease back to the base pace, not full speed
}

onWorldReset(() => { scale = BASE_PACE; slowUntil = 0; });
