// ai/enemies.js — PvE wave-survival mode's hostile entity family (label 'enemy').
// Everything rides the existing summon / collision / explode / boss-AI plumbing,
// so enemies get physics, lava-culling and cleanup for free. The wave manager
// and run lifecycle that drive them live in src/sim/waves.js.
//
// Wave mode is designed for couch play, but enemies DO ride the wire: spawnEnemy
// routes through summon(), and serializeSnapshot emits every summons body, so a LAN
// host broadcasts enemies to clients (they render as plain colored blobs client-side
// unless the ghost carries the type; the host draws them fully). What's genuinely
// couch-only is *starting* a wave run — there's no network start message, so the host
// begins one from its own keyboard (M then Space). This lets a spectator host render
// a networked Alinea fighting the waves.
import { Bodies, Body, Composite, world, W } from '../world.js';
import { performance } from '../env.js';
import { rand } from '../rng.js';
import { spawnParticles, spawnRing, addShake } from '../fx.js';
import { sfx } from '../sfx.js';
import { game } from '../match.js';
import { damagePlayer } from '../player/combat.js';
import { projectiles, summons, summon, removeSummon, explode } from '../spells/core.js';
import { bossAliveTarget } from './boss.js';

export const enemies = new Set();      // live enemy bodies (for wave-clear counting)

// ---------- shared hostile attacks (mirror the boss helpers) ----------

// a projectile an archer/boss-add throws at a wizard. owner:'boss' is the
// hostile-to-players sentinel used across the game — full damage to any player,
// and (via explode's owner!=='boss' guard) it never hurts fellow enemies.
export function enemyBolt(from, target, { speed = 9, r = 7, color = '#ff8c5a', spread = 0, boom = [55, 8, 10] } = {}) {
  const t = target.body.position;
  const a = Math.atan2(t.y - from.y, t.x - from.x) + spread;
  const fb = Bodies.circle(from.x + Math.cos(a) * 24, from.y + Math.sin(a) * 24, r, { density: 0.004, frictionAir: 0, label: 'projectile' });
  fb.owner = 'boss';
  fb.color = color;
  fb.gravityScale = 0.3;
  fb.expireAt = performance.now() + 5000;
  fb.onHit = self => explode(self.position.x, self.position.y, boom[0], boom[1], boom[2], 'boss');
  Body.setVelocity(fb, { x: Math.cos(a) * speed, y: Math.sin(a) * speed });
  projectiles.add(fb);
  Composite.add(world, fb);
  return fb;
}

// a melee swing: if a wizard is within reach, hit them once per the enemy's own
// cooldown (a swarm of 5 = 5 staggered swings, not one shared machine-gun).
export function enemyStrike(b, e, now, reach = 34) {
  if (now < (b._touchAt || 0)) return;
  const t = bossAliveTarget(b.position);
  if (!t) return;
  const q = t.body.position;
  if (Math.abs(q.x - b.position.x) < reach && Math.abs(q.y - b.position.y) < 44) {
    b._touchAt = now + 700;
    damagePlayer(t, e.dmg);
    const away = Math.sign(q.x - b.position.x) || 1;
    Body.setVelocity(t.body, { x: away * 6, y: -5 });
    spawnParticles(q.x, q.y, e.color, 6, 4);
  }
}

// walk the body toward its nearest target; jump when the target is above and we're
// grounded. Returns the target (or null) so callers can layer ranged behavior.
export function enemyChase(b, now, { speed = 1.1, jump = true } = {}) {
  const t = bossAliveTarget(b.position);
  if (!t) return null;
  const dir = Math.sign(t.body.position.x - b.position.x) || 1;
  Body.setVelocity(b, { x: b.velocity.x * 0.8 + dir * speed, y: b.velocity.y });
  const grounded = Math.abs(b.velocity.y) < 1;
  if (jump && grounded && t.body.position.y < b.position.y - 60 && now > (b._jumpAt || 0)) {
    b._jumpAt = now + 900;
    Body.setVelocity(b, { x: b.velocity.x, y: -11 });
  }
  return t;
}

// ---------- enemy roster ----------

export const ENEMY_TYPES = {
  // grunt: marches in and swings a blade
  swordsman: {
    color: '#5b5470', hp: 40, dmg: 12,
    make(x, y) { return Bodies.rectangle(x, y, 26, 44, { density: 0.012, friction: 0.6, frictionAir: 0.02, restitution: 0, label: 'enemy', chamfer: { radius: 6 } }); },
    ai(e, b, now) { enemyChase(b, now, { speed: 1.15 }); enemyStrike(b, e, now, 36); },
  },
  // ranged: hangs back and fires bolts, backpedals when crowded
  archer: {
    color: '#8fce7a', hp: 28, dmg: 9,
    make(x, y) { return Bodies.rectangle(x, y, 24, 42, { density: 0.01, friction: 0.6, frictionAir: 0.03, restitution: 0, label: 'enemy', chamfer: { radius: 6 } }); },
    ai(e, b, now) {
      const t = bossAliveTarget(b.position);
      if (!t) return;
      const d = Math.hypot(t.body.position.x - b.position.x, t.body.position.y - b.position.y);
      const dir = Math.sign(t.body.position.x - b.position.x) || 1;
      // hold a mid range: close in from afar, back off when too close
      const move = d > 360 ? dir : d < 200 ? -dir : 0;
      Body.setVelocity(b, { x: b.velocity.x * 0.82 + move * 1.0, y: b.velocity.y });
      if (now > (b._fireAt || (b._fireAt = now + 900))) {
        b._fireAt = now + rand(1400, 2100);
        enemyBolt(b.position, t, { speed: 10, r: 6, color: '#8fce7a', boom: [50, 7, e.dmg] });
        sfx.cast?.();
      }
    },
  },
  // swarm: small, fast, hops straight at the nearest wizard
  bug: {
    color: '#b57edc', hp: 14, dmg: 7,
    make(x, y) { return Bodies.circle(x, y, 12, { density: 0.004, friction: 0.4, frictionAir: 0.01, restitution: 0.5, label: 'enemy' }); },
    ai(e, b, now) {
      const t = bossAliveTarget(b.position);
      if (!t) return;
      const dir = Math.sign(t.body.position.x - b.position.x) || 1;
      if (Math.abs(b.velocity.y) < 1 && now > (b._hopAt || 0)) {
        b._hopAt = now + rand(320, 560);
        Body.setVelocity(b, { x: dir * rand(3, 5.5), y: -7 });
      }
      enemyStrike(b, e, now, 20);
    },
  },
  // heavy: slow, tanky, leaps and slams the ground for an AoE shock
  ogre: {
    color: '#c98a4a', hp: 120, dmg: 20,
    make(x, y) { return Bodies.rectangle(x, y, 54, 70, { density: 0.03, friction: 0.8, frictionAir: 0.02, restitution: 0, label: 'enemy', chamfer: { radius: 8 } }); },
    ai(e, b, now) {
      const t = enemyChase(b, now, { speed: 0.7, jump: false });
      if (!t) return;
      if (now > (b._leapAt || (b._leapAt = now + 2500)) && Math.abs(b.velocity.y) < 1) {
        b._leapAt = now + rand(4000, 6000);
        b._airborne = true;
        const dir = Math.sign(t.body.position.x - b.position.x) || 1;
        Body.setVelocity(b, { x: dir * rand(4, 7), y: -14 });
        sfx.boing?.();
      }
      if (b._airborne && b.velocity.y >= 0 && Math.abs(b.velocity.y) < 0.8) {
        b._airborne = false;
        explode(b.position.x, b.position.y + 24, 110, 14, e.dmg, 'boss');
        addShake(10);
      }
      enemyStrike(b, e, now, 44);
    },
  },
};

// ---------- spawn / damage / update ----------

export function spawnEnemy(type, x, y, tier = 1) {
  const def = ENEMY_TYPES[type];
  if (!def) return null;
  const b = def.make(x, y);
  b.label = 'enemy';
  // humanoids stay on their feet (bugs are free to tumble) — infinite rotational
  // inertia stops rectangles from toppling over on every bump, like the golem does
  if (type !== 'bug') { Body.setInertia(b, Infinity); Body.setAngle(b, 0); }
  const hp = Math.round(def.hp * (1 + 0.35 * (tier - 1)));
  const e = { type, tier, color: def.color, hp, maxHp: hp, dmg: def.dmg * (1 + 0.25 * (tier - 1)), hurtAt: 0, body: b };
  b.enemy = e;
  enemies.add(b);
  summon(b, { life: 1e12, color: def.color }); // adds to world + summons (cleanup/lava-cull for free)
  return e;
}

export function damageEnemy(e, dmg, at, src) {
  if (!e || e.hp <= 0) return;
  e.hp -= dmg;
  e.hurtAt = performance.now();
  if (at) spawnParticles(at.x, at.y, e.color, 6, 4);
  if (e.hp <= 0) killEnemy(e, src);
}

export function killEnemy(e, src) {
  const b = e.body;
  if (!enemies.has(b)) return;
  enemies.delete(b);
  spawnParticles(b.position.x, b.position.y, e.color, 18, 8, 40);
  spawnRing(b.position.x, b.position.y, e.color);
  removeSummon(b); // out of summons + world
  sfx.death?.();
}


export function updateEnemies(now, dt) {
  if (game.state !== 'PLAY') return;
  for (const b of [...enemies]) {
    // reconcile with summons: postPhysics may have culled a body that fell off the
    // map / into lava — treat that as cleared so the wave counter stays honest.
    if (!summons.has(b)) { enemies.delete(b); continue; }
    const e = b.enemy;
    if (!e || e.hp <= 0) { enemies.delete(b); continue; }
    ENEMY_TYPES[e.type].ai(e, b, now, dt);
  }
}
