// player/status.js — the timed statuses a wizard can be under, and the parry
// that grants two of them.
import { setFrictionAir } from '../phys/facade.js';
import { spawnParticles, spawnRing } from '../fx.js';
import { sfx } from '../sfx.js';

export function clearStatuses(p) {
  p.frozenUntil = 0; p.burnUntil = 0; p.nextBurnTick = 0; p.wetUntil = 0;
  p.reversedUntil = 0; p.slipUntil = 0; p.floatyUntil = 0; p.featherUntil = 0;
  p.heavyUntil = 0; p.speedUntil = 0; p.jumpBoostUntil = 0;
  p.invulnUntil = 0; p.reflectUntil = 0; p.shrinkUntil = 0;
  p.growUntil = 0; p.pigUntil = 0; p.megaCasts = 0; p.megaUntil = 0;
  p.blockCdUntil = 0;
}

// C8. FREEZE OWNS ITS OWN PHYSICS.
//
// Sixteen spells used to write `q.body.frictionAir = 0.001` beside their
// `q.frozenUntil = …`, and one transition check in updatePlayers restored
// 0.02 on the way out. Two halves of one status, owned by nobody, and the
// pairing was maintained by hand at every site — three of the nineteen freeze
// sites never wrote the friction at all.
//
// What did NOT move here is the composition rule. The nineteen sites do not
// agree on how a second freeze meets a live one: three compose with Math.max
// (the ice destructible, Avalanche's chunks, Blizzard's per-tick chill) and the
// other sixteen overwrite — a late 450ms Ice Shard genuinely cuts a live 2600ms
// Permafrost short, and that is counterplay. Folding a Math.max into the
// helper would have handed the overwriting majority a rule they never had, and
// that is precisely the mistake this refactor keeps producing: the identity was
// in the per-site expression, not in the field name. So the deadline is
// computed by the caller and passed in absolute, and `Math.max` stays visible
// at the three sites that mean it.
export const BASE_FRICTION_AIR = 0.02;   // a wizard's normal drag (lifecycle.js)
export const FROZEN_FRICTION_AIR = 0.001; // ice: you keep whatever speed you had

// Freeze until `until` (an absolute simNow() deadline) and slick the body.
export function applyFreeze(p, until) {
  p.frozenUntil = until;
  setFrictionAir(p.body, FROZEN_FRICTION_AIR);
}

// THE THREE EXCEPTIONS: Ice Shard, Blizzard's per-tick chill and Pandemonium's
// freeze roll set the deadline and have never touched the body. They are held
// here rather than left writing the field raw, so the asymmetry is visible and
// the "nothing else writes frozenUntil" gate can be enforced. Whether they
// SHOULD slick is a balance question, and balance is frozen this task.
export function freezeUntil(p, until) {
  p.frozenUntil = until;
}

// The other half: the per-tick transition out. Lifted verbatim out of
// updatePlayers, where it was the only code that knew freeze had a physical
// side effect to undo. Task 13 turns the puff into an emit(); direct for now.
export function tickStatuses(p, now) {
  const frozen = now < p.frozenUntil;
  if (p.wasFrozen && !frozen) {
    setFrictionAir(p.body, BASE_FRICTION_AIR);
    spawnParticles(p.body.position.x, p.body.position.y, '#9be7ff', 10, 4);
    p.wetUntil = now + 4500; // just thawed → Wet (conducts lightning)
  }
  p.wasFrozen = frozen;
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
