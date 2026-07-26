// player/status.js — the timed statuses a wizard can be under, and the parry
// that grants two of them.
import { spawnRing } from '../fx.js';
import { sfx } from '../sfx.js';

export function clearStatuses(p) {
  p.frozenUntil = 0; p.burnUntil = 0; p.nextBurnTick = 0; p.wetUntil = 0;
  p.reversedUntil = 0; p.slipUntil = 0; p.floatyUntil = 0; p.featherUntil = 0;
  p.heavyUntil = 0; p.speedUntil = 0; p.jumpBoostUntil = 0;
  p.invulnUntil = 0; p.reflectUntil = 0; p.shrinkUntil = 0;
  p.growUntil = 0; p.pigUntil = 0; p.megaCasts = 0; p.megaUntil = 0;
  p.blockCdUntil = 0;
}

// BLOCK: a split-second parry on its own button. While it's up you take no
// damage and projectiles bounce back at the sender (the reflect path). It's a
// timed read, not a turtle: ~a quarter second of safety, then a real cooldown.
export const BLOCK_MS = 240, BLOCK_CD = 1400;
export function tryBlock(p, now) {
  if (now < (p.blockCdUntil || 0) || now < (p.frozenUntil || 0)) return;
  p.blockCdUntil = now + BLOCK_CD;
  p.invulnUntil = Math.max(p.invulnUntil || 0, now + BLOCK_MS);
  p.reflectUntil = Math.max(p.reflectUntil || 0, now + BLOCK_MS);
  spawnRing(p.body.position.x, p.body.position.y, '#4ecdff');
  sfx.clang?.();
}
