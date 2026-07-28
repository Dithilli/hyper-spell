// spells/core.js — spell core: projectiles, explosions, summons, effects, casting.
//
// The effect objects pushed onto activeEffects still carry a draw() — those
// closures now take the render surface as an argument instead of reaching for a
// global ctx, which is what keeps sim/ free of a render/ import. Task 13 turns
// them into emitted events and the drawing moves out entirely.
import { H, onWorldReset } from '../world.js';
import {
  addBody, allJoints, createCircle, gravityY, queryRadius, queryRay, removeBody,
  removeFrom, setAngularVelocity, setVelocity,
} from '../phys/facade.js';
import { perSecond, simNow } from '../time.js';
import { simRandom, rand } from '../rng.js';
import {
  particles, spawnParticles, spawnRing, spawnText, addShake, doFlash,
} from '../fx.js';
import { slowMo } from '../pace.js';
import { sfx } from '../sfx.js';
import { statFor } from '../awards.js';
import { telCast } from '../telemetry.js';
import { damageBoss } from '../ai/boss.js';
import { damageEnemy } from '../ai/enemies.js';
import { damageDestructible } from '../maps/builders.js';
import { players, gibs } from '../player/lifecycle.js';
import { damagePlayer } from '../player/combat.js';
import { gravDirFor } from '../player/controller.js';
import { tomes, hats } from '../pickups.js';
import { currentMap, setBanner } from '../match.js';
import { SPELLS } from './registry.js';

export const projectiles = new Set();
export const activeEffects = [];
export const summons = new Set();

// The predicate almost every area spell shares: a body the world can throw
// around. Statics are scenery and sensors are triggers, and neither takes a
// shove. Passed to the facade's queries so the narrowing happens inside physics
// rather than over a copy of the whole world.
export const loose = (b) => !b.isStatic && !b.isSensor;

// unit direction a player is aiming: mouse/stick aim if present,
// else classic facing + lob elevation (vy), gravity-aware
export function aimDir(p, speed = 20, vy = 0) {
  if (p.aimAngle != null) return { x: Math.cos(p.aimAngle), y: Math.sin(p.aimAngle) };
  const gdir = gravDirFor(p);
  const len = Math.hypot(speed, vy) || 1;
  return { x: p.facing * (speed / len), y: (vy * gdir) / len };
}

export function shoot(p, { r, speed, vy = 0, color, density = 0.002, restitution = 0.6, expireMs, gravityScale = 1, angle }) {
  const { x, y } = p.body.position;
  const dir = angle != null ? { x: Math.cos(angle), y: Math.sin(angle) } : aimDir(p, speed, vy);
  const spd = Math.hypot(speed, vy);
  // B11. The muzzle sits 28px along the aim, and nothing used to check what was
  // there: cast with your back to a wall and the ball was born inside it, where
  // the solver either squirted it out sideways or held it still. Ray the offset
  // and stop 4px short of whatever it meets.
  const muzzle = { x: x + dir.x * 28, y: y - 6 + dir.y * 16 };
  const blocked = queryRay({ x, y: y - 6 }, muzzle,
    { filter: (b) => b.isStatic && !b.isSensor && b.collisionFilter.mask !== 0 });
  const spawn = blocked
    ? { x: blocked.point.x - dir.x * 4, y: blocked.point.y - dir.y * 4 }
    : muzzle;
  const fb = createCircle(spawn.x, spawn.y, r, {
    density, frictionAir: 0, restitution, label: 'projectile',
    collisionFilter: { group: p.group },
  });
  fb.owner = p;
  fb.color = color;
  fb.gravityScale = gravityScale;
  if (expireMs) fb.expireAt = simNow() + expireMs;
  setVelocity(fb, { x: dir.x * spd, y: dir.y * spd });
  projectiles.add(fb);
  addBody(fb);
  return fb;
}

export function dropProjectile(p, x, y, { r = 10, vx = 0, vy = 12, color, density = 0.004, expireMs = 6000 }) {
  if (gravityY() < 0) { y = H - y; vy = -vy; } // "sky" is below when gravity flips
  const fb = createCircle(x, y, r, { density, frictionAir: 0, label: 'projectile' });
  fb.owner = p;
  fb.color = color;
  fb.gravityScale = 1;
  fb.expireAt = simNow() + expireMs;
  setVelocity(fb, { x: vx, y: vy });
  projectiles.add(fb);
  addBody(fb);
  return fb;
}

export function removeProjectile(fb) {
  projectiles.delete(fb);
  removeBody(fb);
}

export function summon(body, { life = 5000, color, ...flags } = {}) {
  if (color) body.render.fillStyle = color;
  Object.assign(body, flags);
  body.dieAt = simNow() + life;
  summons.add(body);
  addBody(body);
  return body;
}

export function removeSummon(b) {
  if (!summons.has(b)) return;
  summons.delete(b);
  spawnParticles(b.position.x, b.position.y, b.render.fillStyle || '#e8d5ff', 6, 3, 20);
  removeBody(b);
}

export function enemiesOf(p) {
  return players.filter(q => q.alive && q !== p);
}

export function nearestEnemy(p, maxD = 1e9, from = p.body.position) {
  let best = null, bd = maxD;
  for (const q of enemiesOf(p)) {
    const d = Math.hypot(q.body.position.x - from.x, q.body.position.y - from.y);
    if (d < bd) { bd = d; best = q; }
  }
  return best;
}

export function explode(x, y, radius = 150, power = 22, damage = 0, owner = null, opts = {}) {
  addShake(Math.min(14, power * 0.7));
  sfx.explosion();
  spawnRing(x, y, '#ffb347');
  spawnParticles(x, y, '#ffb347', 26, 9);
  spawnParticles(x, y, '#ff5e57', 18, 7);
  if (power >= 18) doFlash('#ffb347', 0.12);
  for (const body of queryRadius({ x, y }, radius)) {
    const dx = body.position.x - x, dy = body.position.y - y;
    const d = Math.hypot(dx, dy);
    if (d === 0) continue; // dead centre has no direction to be thrown in
    if (body.label === 'boss' && damage && owner !== 'boss') {
      damageBoss(damage * (1 - d / (radius * 1.15)) * 1.2, body.position, owner);
    }
    if (body.isStatic) {
      if (body.label === 'icicle') body._blast = true;
      if (body.label === 'destructible' && damage) damageDestructible(body, damage * (1 - d / (radius * 1.1)));
      continue;
    }
    const s = 1 - d / radius;
    setVelocity(body, {
      x: body.velocity.x + (dx / d) * power * s,
      y: body.velocity.y + (dy / d) * power * s - 4 * s,
    });
    setAngularVelocity(body, body.angularVelocity + (simRandom() - 0.5) * 0.4);
    if (body.label === 'player' && damage) {
      const dmg = damage * (1 - d / (radius * 1.15));
      // your own blast normally costs you half damage (rocket-jumps are a gamble),
      // but selfSafe blasts (fusion ultimates) never hurt their caster — only shove
      if (body.player === owner) { if (!opts.selfSafe) damagePlayer(body.player, dmg * 0.5, owner); }
      else damagePlayer(body.player, dmg, owner);
    }
    // wizard AoE hurts wave-mode enemies too; owner 'boss' is a hostile blast (no friendly fire)
    if (body.label === 'enemy' && damage && owner !== 'boss') {
      damageEnemy(body.enemy, damage * (1 - d / (radius * 1.15)), body.position, owner);
    }
  }
  for (const c of allJoints(currentMap.composite)) {
    if (c.label !== 'breakable') continue;
    const pos = (c.bodyA || c.bodyB).position;
    if (Math.hypot(pos.x - x, pos.y - y) < radius * 0.75) removeFrom(currentMap.composite, c);
  }
}

export function raycastHit(p, angOff = 0) {
  let dir = aimDir(p, 1, 0);
  if (angOff) {
    const a = Math.atan2(dir.y, dir.x) + angOff;
    dir = { x: Math.cos(a), y: Math.sin(a) };
  }
  const from = { x: p.body.position.x + dir.x * 22, y: p.body.position.y - 6 + dir.y * 14 };
  const to = { x: from.x + dir.x * 1400, y: from.y + dir.y * 1400 };
  // B2/B9. This used to sample the aim every 10px and point-test each sample,
  // so a beam could pass clean through any platform thinner than its stride —
  // and when it did connect, `pt` was the sample, up to 10px inside whatever it
  // hit, rather than the surface. One segment query answers both.
  const hit = queryRay(from, to, {
    filter: (b) => b !== p.body && !b.isSensor && b.label !== 'gib' && b.label !== 'projectile'
      && b.collisionFilter.mask !== 0,
  });
  return { hit: hit?.body ?? null, pt: hit?.point ?? to, from, dir };
}

function baseBoltVisual(x0, y0, x1, y1, color = '#fff89e', width = 3, life = 130) {
  const pts = [{ x: x0, y: y0 }];
  const segs = 9;
  for (let i = 1; i <= segs; i++) {
    pts.push({
      x: x0 + (x1 - x0) * i / segs + (i < segs ? rand(-14, 14) : 0),
      y: y0 + (y1 - y0) * i / segs + (i < segs ? rand(-14, 14) : 0),
    });
  }
  activeEffects.push({
    until: simNow() + life,
    draw(now, ctx) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (const q of pts.slice(1)) ctx.lineTo(q.x, q.y);
      ctx.stroke();
    },
  });
}

// B12. The old form stepped y by 12 from the ceiling and returned the first
// sample that landed inside something, which is wrong twice over: an 8px ledge
// fits between two samples and reads as open sky, and a hit reports the sample
// rather than the surface, so Volcano, Trampoline and the Lightning Rod placed
// themselves up to 12px into the platform they were standing on.
export function groundYAt(x) {
  const hit = queryRay({ x, y: 0 }, { x, y: H },
    { filter: (b) => b.isStatic && !b.isSensor && b.collisionFilter.mask !== 0 });
  return hit ? hit.point.y : H - 30;
}

// lightning CONDUCTION synergy: a Wet target takes amplified damage and the bolt
// arcs on to the nearest other wizard. Used by the beam primitives (zapRay).
export function zapHit(target, dmg, src) {
  const now = simNow();
  if (now < (target.wetUntil || 0)) {
    dmg *= 1.6;
    spawnText(target.body.position.x, target.body.position.y - 46, 'CONDUCT!', '#9ef0f0');
    let best = null, bd = 300;
    for (const q of players) {
      if (!q.alive || q === target || q === src) continue;
      const d = Math.hypot(q.body.position.x - target.body.position.x, q.body.position.y - target.body.position.y);
      if (d < bd) { bd = d; best = q; }
    }
    if (best) {
      boltVisual(target.body.position.x, target.body.position.y, best.body.position.x, best.body.position.y, '#9ef0f0', 3, 120);
      damagePlayer(best, dmg * 0.45, src);
    }
  }
  damagePlayer(target, dmg, src);
}

export function skyBolt(x, dmg, owner, m = 1, opts) {
  const hitY = groundYAt(x);
  boltVisual(x, -20, x, hitY, '#fff89e', 3 * m);
  doFlash('#ffffff', 0.2);
  sfx.lightning();
  explode(x, hitY, 80 * m, 12 * m, dmg * m, owner, opts);
}

export function spawnSingularity(x, y, m = 1, owner = null, opts = {}) {
  sfx.blackhole();
  doFlash('#a55eea', 0.2);
  spawnRing(x, y, '#a55eea');
  activeEffects.push({
    until: simNow() + 2200 * m,
    net: { k: 'sing', x, y },
    update() {
      const R = 350 * (1 + (m - 1) * 0.5);
      for (const b of queryRadius({ x, y }, R, { filter: loose })) {
        const dx = x - b.position.x, dy = y - b.position.y;
        const d = Math.hypot(dx, dy);
        if (d === 0) continue;
        if (d < 30) {
          if (b.label === 'player') { if (!(opts.selfSafe && b.player === owner)) damagePlayer(b.player, 999, owner); }
          else if (b.label !== 'boss') { // never consume the boss body — it would strand game.boss
            spawnParticles(b.position.x, b.position.y, '#a55eea', 6, 3);
            projectiles.delete(b); gibs.delete(b); tomes.delete(b); hats.delete(b); summons.delete(b);
            removeBody(b, true);
          }
          continue;
        }
        const s = 1 - d / R;
        const pull = perSecond(0.9) * s, tang = perSecond(0.35) * s;
        setVelocity(b, {
          x: b.velocity.x + (dx / d) * pull + (-dy / d) * tang,
          y: b.velocity.y + (dy / d) * pull + (dx / d) * tang,
        });
      }
      for (const c of allJoints(currentMap.composite)) {
        if (c.label !== 'breakable') continue;
        const pos = (c.bodyA || c.bodyB).position;
        if (Math.hypot(pos.x - x, pos.y - y) < 140) removeFrom(currentMap.composite, c);
      }
      if (simRandom() < 0.6) {
        const a = rand(0, Math.PI * 2), dd = rand(60, 180);
        particles.push({ kind: 'square', x: x + Math.cos(a) * dd, y: y + Math.sin(a) * dd, vx: -Math.cos(a) * 4, vy: -Math.sin(a) * 4, life: 16, maxLife: 16, color: '#a55eea', r: 2.5 });
      }
    },
    draw(now, ctx) {
      ctx.fillStyle = '#0a0510';
      ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#a55eea';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(now * 0.02);
      ctx.beginPath(); ctx.arc(x, y, 36 + 5 * Math.sin(now * 0.011), 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    },
    onEnd() { explode(x, y, 160, 18, 25, owner, opts); },
  });
}

// circular zone effect: calls tick(player) for alive players inside, every tick
export function makeZone({ x, y, r, life, color, tick, tickBody, draw, onEnd }) {
  activeEffects.push({
    until: simNow() + life,
    x, y, r,
    net: { k: 'zone', x, y, r, c: color },
    update(now) {
      if (tick) {
        for (const q of players) {
          if (!q.alive) continue;
          if (Math.hypot(q.body.position.x - x, q.body.position.y - y) < r) tick(q, now);
        }
      }
      // NOTE: the hand-rolled test was `< r` and the facade's is `<= r`. The
      // only body that can tell them apart is one whose centre sits exactly on
      // the rim to the last bit of a double, so this is the one rule in the
      // conversion that is not byte-identical — see the task 9 report.
      if (tickBody) {
        for (const b of queryRadius({ x, y }, r, { filter: loose })) tickBody(b, now);
      }
    },
    draw(now, ctx) {
      if (draw) { draw(now, ctx); return; }
      ctx.globalAlpha = 0.16 + 0.06 * Math.sin(now * 0.01);
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    },
    onEnd,
  });
}

// no spell fires faster than this, no matter how low its own cooldown — turns the
// spammy bolts (ember/zap/ice shard/...) into deliberate, aimed shots. Tune to
// taste: higher = more measured, lower = twitchier.
export const CAST_FLOOR = 480;

// C4. THE ONE COOLDOWN NUMBER. Three readers used to compute "how far through
// the cooldown" from SPELLS[id].cooldown while the cast gate below enforced
// max(cooldown, CAST_FLOOR). Four spells declare less than the floor
// (fireball 450, ember 250, zapspell 350, iceshard 400), so their HUD bar and
// their wire `rd` flag both read READY up to 230ms before the spell would
// actually fire — the bar filled and the button did nothing. Everything that
// asks "how long is this spell's cooldown" asks here.
export const effectiveCooldown = (id) => Math.max(SPELLS[id]?.cooldown ?? 0, CAST_FLOOR);

// C3. POTENCY IS DECIDED AT CAST TIME. castSpell writes p.mega and then calls
// spell.cast(p); a spell that spawns over the next second or two (Dragon's
// Breath fires six bolts across 720ms) used to read p.mega again inside each
// deferred spawn, so a HYPERSPELL proc landing mid-cast retroactively
// supercharged the rest of the volley — and a plain cast landing mid-volley
// quietly de-powered it. A deferred spawner captures its potency at cast and
// threads it through as `o.m`; an immediate one passes nothing and still reads
// the caster, which is the same value at that instant.
export const resolvePotency = (p, o = {}) => o.m ?? p?.mega ?? 1;

// FUSION CHARGES: hybrids are no longer limitless — they burn out after a few
// casts, scaled to their power (cooldown is the power proxy). In exchange each
// cast hits harder: the fewer the charges, the bigger the bang.
export function hybridCharges(def) {
  return def.charges ?? (def.cooldown >= 3400 ? 1 : def.cooldown >= 2400 ? 2 : 3);
}
export function hybridPotency(charges) {
  return charges <= 1 ? 1.5 : charges === 2 ? 1.35 : 1.2;
}

export function castSpell(p, now, slot = 0) {
  const id = p.slots[slot];
  const spell = id && SPELLS[id];
  if (!spell) return;
  if (now - p.casts[slot] < effectiveCooldown(id)) return;
  p.casts[slot] = now;
  p.lastCastSlot = slot; // primary slot for spellId/lastCast accessors + attribution
  telCast(id); // balance: a confirmed cast (past the cooldown gate)
  // HYPERSPELL proc: chance scales with cooldown so spam doesn't farm rolls —
  // ~1.2% per second of cooldown, capped at 6% (rare enough to stay special)
  const hyper = simRandom() < Math.min(0.06, spell.cooldown * 0.000012);
  const potency = spell.hybrid ? hybridPotency(hybridCharges(spell)) : 1;
  p.mega = (p.megaCasts > 0 ? 1.7 : 1) * (hyper ? 2.2 : 1) * potency;
  if (hyper) {
    statFor(p).procs++;
    setBanner('✦ HYPERSPELL ✦', '#e8d5ff', 1100, true);
    doFlash('#a55eea', 0.4);
    slowMo(0.25, 380);
    addShake(10);
    spawnRing(p.body.position.x, p.body.position.y, '#a55eea');
    sfx.hyper();
  }
  sfx.cast();
  spell.cast(p);
  // combo (hybrid) spells get a brief hitstop so you notice the big moment
  if (spell.hybrid && !hyper) { slowMo(0.28, 150); addShake(5); }
  // burn a fusion charge; the last one snuffs the hybrid out of the slot
  if (spell.hybrid && p.slotCharges?.[slot] != null) {
    p.slotCharges[slot]--;
    if (p.slotCharges[slot] <= 0) {
      p.slots[slot] = null;
      p.slotCharges[slot] = null;
      spawnText(p.body.position.x, p.body.position.y - 74, 'FUSION SPENT', '#ff4df0');
      spawnParticles(p.body.position.x, p.body.position.y - 20, '#ff4df0', 14, 4);
      sfx.freeze?.();
    } else {
      spawnText(p.body.position.x, p.body.position.y - 74, `${p.slotCharges[slot]} LEFT`, spell.color);
    }
  }
  if (p.megaCasts > 0) {
    p.megaCasts--;
    spawnText(p.body.position.x, p.body.position.y - 60, `${p.megaCasts} LEFT`, '#ffd700');
    if (p.megaCasts === 0) p.megaUntil = now + 600;
  }
}

// No `dt`: it was threaded to every effect and used by none of them, and now
// that a step is always TICK_MS it could only ever be that constant. An effect
// that needs per-second scaling reaches for perSecond() at its own constant,
// which says what it means where the number is written.
export function updateEffects(now) {
  for (let i = activeEffects.length - 1; i >= 0; i--) {
    const e = activeEffects[i];
    e.update?.(now);
    if (now > e.until) {
      e.onEnd?.();
      activeEffects.splice(i, 1);
    }
  }
}

// the server bridge wraps boltVisual to broadcast it, exactly as it reassigned
// the global before (server/sim-bridge.js:48)
export let boltVisual = baseBoltVisual;
export function setBoltVisual(fn) { boltVisual = fn; }

onWorldReset(() => {
  projectiles.clear();
  summons.clear();
  activeEffects.length = 0;
});
