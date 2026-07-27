// player/combat.js — taking damage, losing the hat, and dying.
import { addBody, createBox, createPolygon, gravityY, removeBody, setAngularVelocity, setVelocity } from '../phys/facade.js';
import { simNow } from '../time.js';
import { simRandom, rand } from '../rng.js';
import { spawnParticles, spawnText, addShake, doFlash } from '../fx.js';
import { slowMo } from '../pace.js';
import { sfx } from '../sfx.js';
import { statFor, creditKill } from '../awards.js';
import { telDmg } from '../telemetry.js';
import { game } from '../match.js';
import { gibs, MAX_HP } from './lifecycle.js';

export function damagePlayer(p, amt, src) {
  if (!p || !p.alive) return;
  const now = simNow();
  if (now < (p.invulnUntil || 0)) {
    spawnText(p.body.position.x, p.body.position.y - 34, 'BLOCKED', '#e8d5ff');
    return;
  }
  if (src && src.slot !== undefined) p.lastHitBy = { player: src, at: now }; // starts the kill-credit timer
  let n = Math.round(amt);
  if (n <= 0) return;
  // SHATTER synergy: a solid blow to a frozen wizard cracks the ice for bonus
  // damage and breaks the freeze (thawing → leaves them Wet, which conducts).
  if (now < (p.frozenUntil || 0) && n >= 8) {
    n += Math.max(8, Math.round(n * 0.6));
    p.frozenUntil = 0;
    spawnText(p.body.position.x, p.body.position.y - 48, 'SHATTER!', '#bfe8ff');
    spawnParticles(p.body.position.x, p.body.position.y, '#bfe8ff', 16, 6);
    sfx.freeze?.();
  }
  if (src && src.spellId) telDmg(src.spellId, n); // balance: damage credited to the attacker's spell
  const hadHat = p.hp >= MAX_HP * 0.5;
  p.hp -= n;
  p.hurtUntil = now + 130;
  if (p.hp <= 0) killPlayer(p);
  else {
    spawnText(p.body.position.x, p.body.position.y - 34, `-${n}`, '#ffffff');
    if (hadHat && p.hp < MAX_HP * 0.5) knockHatOff(p);
  }
}

// crossing below half health knocks the wizard's hat off — the ultimate shame
export function knockHatOff(p) {
  const { x, y } = p.body.position;
  const s = p.sizeScale || 1;
  const hat = createPolygon(x, y - 22 * s, 3, 8, { density: 0.0008, frictionAir: 0.02, angle: -Math.PI / 2, label: 'gib' });
  hat.color = p.hat;
  hat.dieAt = simNow() + 3500;
  setVelocity(hat, { x: p.body.velocity.x * 0.5 + rand(-3, 3), y: -7 * (gravityY() < 0 ? -1 : 1) });
  setAngularVelocity(hat, rand(-0.4, 0.4));
  gibs.add(hat);
  addBody(hat);
  statFor(p).hatsLost++;
  spawnText(x, y - 52 * s, 'THE SHAME!', p.hat);
  sfx.squeak();
}

export function killPlayer(p) {
  if (!p.alive) return;
  p.alive = false;
  const { x, y } = p.body.position;
  spawnParticles(x, y, p.color, 24, 8, 60);
  addShake(10);
  sfx.death();
  doFlash(p.color, 0.12);
  if (game.state === 'PLAY') slowMo(0.3, 550);
  for (let i = 0; i < 6; i++) {
    const gib = createBox(x, y, 14, 4, { density: 0.001, frictionAir: 0.01, label: 'gib' });
    gib.color = p.color;
    gib.dieAt = simNow() + 3000;
    setVelocity(gib, { x: (simRandom() - 0.5) * 16, y: -6 - simRandom() * 8 });
    setAngularVelocity(gib, (simRandom() - 0.5) * 0.6);
    gibs.add(gib);
    addBody(gib);
  }
  removeBody(p.body);
  if (game.state === 'PLAY') {
    creditKill(p);
    p.ghost = { x, y: y - 10, nextGust: 0 }; // linger as a wisp until the round ends
  }
  game.onDeath(p);
}
