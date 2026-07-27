// time.js — the simulation's tick counter and the one place the fixed timestep
// is defined.
//
// This module is a leaf: it imports nothing, so every other sim module can read
// the clock without a cycle. The tick is advanced by whoever drives the sim (the
// platform loops via src/sim/tick-loop.js); Task 4 moves that inside stepSim.
export const TICK_HZ = 60;
export const TICK_MS = 1000 / TICK_HZ;
export const MAX_CATCHUP = 5;

let tick = 0;
export const currentTick = () => tick;
export const advanceTick = () => ++tick;
export const resetTick = (t = 0) => { tick = t; };

// The sim's only clock. Content keeps writing `now + 1500`; this makes that
// deterministic, tick-quantised, and correctly slowed by hitstop.
export const simNow = () => tick * TICK_MS;

// authoring helper: durations stay in milliseconds in content
export const ticks = (ms) => Math.round(ms / TICK_MS);

// Legacy tuning constants were authored against a 60Hz frame. This converts
// them to per-tick values so the same number keeps producing the same motion
// while the unit becomes explicit. At TICK_HZ = 60 this is the identity.
//
// The invariant is per-SECOND totals, not per-tick values: a constant `v` meant
// "v of this, sixty times a second", so at any tick rate the converted value
// times that rate must still come to v * 60. `perSecondAt` takes the rate as an
// argument purely so a test can evaluate that invariant at rates the sim does
// not currently run at — at TICK_MS every candidate wrong implementation
// (reciprocal, bare identity) coincides with the right one, so a test that can
// only see 60Hz cannot tell them apart.
export const LEGACY_FRAME_MS = 1000 / 60;
export const perSecondAt = (perFrameValue, tickMs) => perFrameValue * (tickMs / LEGACY_FRAME_MS);
export const perSecond = (perFrameValue) => perSecondAt(perFrameValue, TICK_MS);
