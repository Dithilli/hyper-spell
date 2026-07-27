// player/controller.js — the per-frame movement, jump, aim and cast pass: the
// bridge between a controller's input and the physics body.
import { Body, Composite, Query, world, engine, W, H } from '../world.js';
import { random } from '../env.js';
import { simNow } from '../time.js';
import { rand } from '../rng.js';
import { spawnParticles, addShake } from '../fx.js';
import { sfx } from '../sfx.js';
import { statFor } from '../awards.js';
import { game, currentMap } from '../match.js';
import { castSpell } from '../spells/core.js';
import { players, FALL_SAFE_DROP, setPlayerScale } from './lifecycle.js';
import { damagePlayer, killPlayer } from './combat.js';
import { tryBlock } from './status.js';

// gravity direction as this player experiences it (Gravity Flip spares its caster)
export function gravDirFor(p) {
  if (p && simNow() < (p.gravityLockUntil || 0)) return p.gravityLockDir;
  return engine.gravity.y < 0 ? -1 : 1;
}

export function grounded(p) {
  const { x, y } = p.body.position;
  const s = p.sizeScale || 1;
  const dir = gravDirFor(p); // support is above you when gravity flips
  const y0 = y + 14 * s * dir, y1 = y + 22 * s * dir;
  const below = Query.region(Composite.allBodies(world), {
    min: { x: x - 11 * s, y: Math.min(y0, y1) },
    max: { x: x + 11 * s, y: Math.max(y0, y1) },
  });
  return below.some(b => b !== p.body && b.label !== 'projectile' && b.label !== 'lava' && b.label !== 'gib' && b.collisionFilter.mask !== 0);
}

export function updatePlayers(now) {
  for (const p of players) {
    if (!p.alive) continue;
    const body = p.body;
    const frozen = now < p.frozenUntil;
    const slipped = now < (p.slipUntil || 0);
    const piggy = now < (p.pigUntil || 0);

    // size management: mega base × status modifier
    const base = (p.megaCasts > 0 || now < p.megaUntil) ? 2 : 1;
    let mod = 1;
    if (now < (p.shrinkUntil || 0) || piggy) mod = 0.6;
    else if (now < (p.growUntil || 0)) mod = 1.85; // past the 1.6 jump-boost threshold so "big" actually buffs you (bigger jump + more mass to shove/resist)
    const desired = base * mod;
    if (Math.abs(desired - p.sizeScale) > 0.01) setPlayerScale(p, desired);

    // burn damage over time
    if (now < (p.burnUntil || 0) && now > (p.nextBurnTick || 0)) {
      p.nextBurnTick = now + 450;
      damagePlayer(p, 3);
      spawnParticles(body.position.x, body.position.y - 10, '#ff8c5a', 3, 3, 20);
    }

    // floaty: balloon-style anti-gravity (1.5× lift — the balloon-hexed drift UP).
    // feather: gentle 0.72× counter-gravity — you fall slowly but never rise.
    const lift = now < (p.floatyUntil || 0) ? 1.5 : now < (p.featherUntil || 0) ? 0.72 : 0;
    if (lift) {
      Body.applyForce(body, body.position, { x: 0, y: -engine.gravity.y * engine.gravity.scale * body.mass * lift });
      if (lift < 1 && random() < 0.06) spawnParticles(body.position.x + rand(-10, 10), body.position.y - 18, '#fffde7', 1, 1.2, 22);
    }

    if (p.wasFrozen && !frozen) {
      body.frictionAir = 0.02;
      spawnParticles(body.position.x, body.position.y, '#9be7ff', 10, 4);
      p.wetUntil = now + 4500; // just thawed → Wet (conducts lightning)
    }
    p.wasFrozen = frozen;
    // standing on ice/snow keeps you Wet; a faint sheen hints at it
    if (currentMap.def.icy || currentMap.data.eventIcy) p.wetUntil = Math.max(p.wetUntil || 0, now + 600);
    if (now < (p.wetUntil || 0) && random() < 0.04) spawnParticles(body.position.x, body.position.y + 8, '#9ec9ff', 1, 1.5, 16);

    const c = p.input;
    const gdir = gravDirFor(p);
    // gravity-locked (a Gravity Flip caster): cancel the flipped world pull, keep your own
    if (now < (p.gravityLockUntil || 0)) {
      const want = p.gravityLockDir * Math.abs(engine.gravity.y);
      Body.applyForce(body, body.position, { x: 0, y: (want - engine.gravity.y) * engine.gravity.scale * body.mass });
    }
    const onGround = grounded(p);
    // fall damage: a long drop ending in a hard landing hurts. Terminal velocity
    // is too low to tell falls apart, so track the drop DISTANCE from the
    // gravity-relative apex; the speed floor spares floaty/low-gravity landings.
    const vAlong = body.velocity.y * gdir;
    if (vAlong > (p.fallPeak || 0)) p.fallPeak = vAlong;
    const yAlong = body.position.y * gdir;
    if (p.lastGdir !== gdir) { p.apexAlong = null; p.fallPeak = 0; p.lastGdir = gdir; }
    if (!onGround) {
      if (p.apexAlong == null || yAlong < p.apexAlong) p.apexAlong = yAlong;
    } else if (vAlong < 2) {
      if (p.apexAlong != null && game.state === 'PLAY' && now > (game.fightAt || 0) && now > (p.floatyUntil || 0) && now > (p.featherUntil || 0)) {
        const drop = yAlong - p.apexAlong;
        if (drop > FALL_SAFE_DROP && p.fallPeak > 14) {
          const dmg = Math.min(40, Math.round((drop - FALL_SAFE_DROP) * 0.12));
          if (dmg >= 3) {
            statFor(p).fallDmg += dmg;
            damagePlayer(p, dmg);
            addShake(4);
            sfx.thud();
            spawnParticles(body.position.x, body.position.y + 14 * gdir, '#9c8ab8', 8, 3, 25);
          }
        }
      }
      p.apexAlong = null;
      p.fallPeak = 0;
    }
    if (!frozen && !slipped && game.state !== 'VICTORY') {
      if (onGround) { p.lastGround = now; p.airJumps = 1; }
      const canJump = now - p.lastGround < 120;
      let move = c.move;
      if (now < (p.reversedUntil || 0)) move = -move;
      // aim: mouse point or right stick beats movement facing
      if (c.aimVec) p.aimAngle = Math.atan2(c.aimVec.y, c.aimVec.x);
      else if (c.aimPoint) p.aimAngle = Math.atan2(c.aimPoint.y - body.position.y, c.aimPoint.x - body.position.x);
      else if (c.aimAngle != null) p.aimAngle = c.aimAngle; // network players send a precomputed angle
      else p.aimAngle = null;
      if (p.aimAngle != null && Math.abs(Math.cos(p.aimAngle)) > 0.25) p.facing = Math.cos(p.aimAngle) > 0 ? 1 : -1;
      else if (move) p.facing = move > 0 ? 1 : -1;
      let target = move * 6;
      if (now < (p.speedUntil || 0)) target *= 1.6;
      if (now < (p.heavyUntil || 0)) target *= 0.5;
      if (currentMap.def.muddy || now < (p.vineSlowUntil || 0)) target *= 0.65;
      const icy = currentMap.def.icy || currentMap.data.eventIcy;
      const blend = onGround ? (icy ? 0.09 : currentMap.def.muddy ? 0.12 : 0.25) : 0.08;
      Body.setVelocity(body, { x: body.velocity.x + (target - body.velocity.x) * blend, y: body.velocity.y });

      const heavy = now < (p.heavyUntil || 0);
      // jump away from whatever you stand on (gdir computed above, per player)
      const jumpVy = (now < (p.jumpBoostUntil || 0) ? -22 : (p.sizeScale > 1.6 ? -17 : -15)) * gdir;
      if (!heavy) {
        if (c.jump && canJump && body.velocity.y * gdir > -2) {
          Body.setVelocity(body, { x: body.velocity.x, y: jumpVy });
          p.lastGround = 0;
          sfx.jump();
        } else if (c.jumpPressed && !canJump && p.airJumps > 0) {
          p.airJumps--;
          Body.setVelocity(body, { x: body.velocity.x, y: (now < (p.jumpBoostUntil || 0) ? -19 : -13) * gdir });
          spawnParticles(body.position.x, body.position.y + 12 * gdir, '#e8d5ff', 8, 3, 20);
          sfx.jump();
        }
      }
      if (!piggy && now > (game.fightAt || 0)) {
        if (c.blockPressed) tryBlock(p, now);
        if (c.cast && p.slots[0]) castSpell(p, now, 0);
        if (c.cast2 && p.slots[1]) castSpell(p, now, 1);
      }
    }
    // right yourself after a blow (skip while slipping on a banana)
    if (!slipped) Body.setAngle(body, body.angle * 0.88);
    Body.setAngularVelocity(body, body.angularVelocity * 0.9);
    p.walkPhase += Math.abs(body.velocity.x) * 0.06;
    if (body.position.y > H + 60) killPlayer(p);
    if (currentMap.def.wrap) {
      if (body.position.x < -20) Body.setPosition(body, { x: W + 15, y: body.position.y });
      if (body.position.x > W + 20) Body.setPosition(body, { x: -15, y: body.position.y });
    }
  }
}
