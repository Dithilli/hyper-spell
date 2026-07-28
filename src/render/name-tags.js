// name-tags.js — per-frame slot reservation for wizard nametags.
//
// Two wizards standing on the same tile used to render their tags at the same
// y, so "BREW" and "JESTER" overlapped into "BREWJESTER". A tag now claims a
// slot and steps up until it stops clashing.
//
// This lives in its own module rather than in draw-wizard.js because the reset
// belongs to the frame, not to the wizard draw: beginWorld() is the one call
// every render path makes exactly once per frame, so that is where the slots
// clear. Putting it in draw-wizard.js would make camera.js import draw-wizard.js
// while draw-wizard.js imports camera.js for the zoom — a cycle for one array.
const _tagSlots = [];

export function resetNameTagSlots() { _tagSlots.length = 0; }

export function claimTagSlot(x, y, halfW) {
  const STEP = 13, LIMIT = 5;
  let ty = y;
  for (let i = 0; i <= LIMIT; i++) {
    const clash = _tagSlots.some(s => Math.abs(s.y - ty) < STEP - 1 && Math.abs(s.x - x) < s.halfW + halfW + 4);
    if (!clash) break;
    ty -= STEP;
  }
  _tagSlots.push({ x, y: ty, halfW });
  return ty;
}
