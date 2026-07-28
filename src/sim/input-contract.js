// input-contract.js — the shape every controller must poll into.
// Keyboard, gamepad, bot and network controllers all return this set of fields;
// a fresh copy of IDLE_INPUT is what a player has before anything is pressed.
export const IDLE_INPUT = { move: 0, jump: false, cast: false, cast2: false, block: false, jumpPressed: false, castPressed: false, cast2Pressed: false, blockPressed: false, startPressed: false, aimPoint: null, aimVec: null };
