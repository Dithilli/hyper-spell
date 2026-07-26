// pace.js — the game's master tempo and its hitstop.
//
// slowMo is the one cosmetic that is also simulation: it scales the timestep, so
// the server both calls it and broadcasts it.
import { performance } from './env.js';
import { onWorldReset } from './world.js';

// master game pace: 1 = original, <1 = calmer & more readable so the spectacle
// (combos, fusions, big spells) registers instead of flashing by. Tune to taste.
export const BASE_PACE = 0.85;

export let timeScale = 1;
let slowUntil = 0;

function baseSlowMo(scale, ms) { timeScale = scale; slowUntil = performance.now() + ms; }

export let slowMo = baseSlowMo;
export function setSlowMo(fn) { slowMo = fn; }

export function updateTimeScale(now) {
  if (now > slowUntil) timeScale += (BASE_PACE - timeScale) * 0.08; // ease back to the base pace, not full speed
}

onWorldReset(() => { timeScale = 1; slowUntil = 0; });
