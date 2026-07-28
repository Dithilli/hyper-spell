// spells/book.js — 100 spells. Fun first, balance second.
//
// Content file: moved verbatim from js/spellbook.js. The only edits are the
// module header below and the effect draw() closures, which now take the render
// surface as an argument instead of reaching for a global ctx.
import { W, H, column } from '../world.js';
import {
  addVelocity, allBodies, createBox, createCircle, createPolygon, gravityY,
  queryCapsule, queryRadius, queryRegion, removeBody, setAngularVelocity,
  setPosition, setType, setVelocity,
} from '../phys/facade.js';
import { push as pushGravity, pop as popGravity } from '../gravity.js';
import { perSecond, simNow } from '../time.js';
import { simRandom, rand, pick } from '../rng.js';
import { particles, spawnParticles, spawnRing, spawnText, addShake, doFlash } from '../fx.js';
import { slowMo } from '../pace.js';
import { sfx } from '../sfx.js';
// `game` is no longer imported: gravflip and moongrav were the last readers of
// game.baseGravity here, and they compose over the base now instead of naming it.
import { setBanner } from '../match.js';
import { players, gibs, healPlayer, disarmPlayer } from '../player/lifecycle.js';
import { damagePlayer } from '../player/combat.js';
import { grounded } from '../player/controller.js';
import { applyFreeze, freezeUntil } from '../player/status.js';
import { tomes, hats } from '../pickups.js';
import { damageBoss } from '../ai/boss.js';
import { SPELLS } from './registry.js';
import {
  projectiles, summons, activeEffects, aimDir, shoot, dropProjectile, removeProjectile, summon, enemiesOf, nearestEnemy, explode, raycastHit, boltVisual, groundYAt, zapHit, skyBolt, makeZone, loose, resolvePotency,
} from './core.js';

// filled here, merged into SPELLS by src/sim/content.js
export const BOOK_SPELLS = {};
function regSpell(id, def) { BOOK_SPELLS[id] = def; }

// C1. THE SPELLS ROULETTE AND MIRROR CAST MAY PRODUCE.
//
// Hybrids exist only through fusion: you hold two spells of the right pair and
// they combine, spending charges. Both of these picked uniformly over
// Object.keys(SPELLS), which is every registered spell — 36 of the 142 are
// hybrids, so roughly a quarter of Roulette casts handed out a fusion-only
// spell for free, at no charge cost, from a 1000ms uncommon. Matches the rule
// tomePool() already followed (src/sim/pickups.js).
const castablePool = () =>
  Object.keys(SPELLS).filter((k) => k !== 'roulette' && k !== 'mirrorcast' && !SPELLS[k].hybrid);
export const roulettePool = castablePool;
export const mirrorPool = castablePool;
const mirrorEligible = (id) => !!id && mirrorPool().includes(id);

// generic exploding bolt
export function boomBolt(p, o = {}) {
  const m = resolvePotency(p, o);
  const fb = shoot(p, {
    r: (o.r ?? 7) * m, speed: o.speed ?? 20, vy: o.vy ?? -6,
    color: o.color, gravityScale: o.g ?? 0.45,
    restitution: o.rest ?? 0.6, expireMs: o.expireMs, density: o.density ?? 0.002,
    angle: o.angle,
  });
  if (o.blast !== false) {
    fb.onHit = () => explode(fb.position.x, fb.position.y, (o.radius ?? 120) * m, (o.power ?? 18) * m, (o.dmg ?? 25) * m, fb.owner, o.selfSafe ? { selfSafe: true } : undefined);
  }
  return fb;
}

// bolt that applies a status to the player it hits
export function statusBolt(p, o, apply) {
  const m = resolvePotency(p, o);
  const fb = shoot(p, { r: (o.r ?? 6) * m, speed: o.speed ?? 18, vy: o.vy ?? -5, color: o.color, gravityScale: o.g ?? 0.5 });
  fb.onHit = (self, other) => {
    spawnParticles(self.position.x, self.position.y, o.color, 10, 4);
    if (o.dmg && other && other.label === 'player') damagePlayer(other.player, o.dmg * m, p);
    if (other && other.label === 'player' && other.player.alive) apply(other.player, m);
  };
  return fb;
}

export function zapRay(p, dmg, imp, width = 3, angOff = 0) {
  const m = resolvePotency(p);
  const { hit, pt, from, dir } = raycastHit(p, angOff);
  boltVisual(from.x, from.y, pt.x, pt.y, '#fff89e', width * m);
  spawnParticles(pt.x, pt.y, '#fff89e', 10, 5);
  if (hit && !hit.isStatic) {
    setVelocity(hit, { x: hit.velocity.x + dir.x * imp * m, y: hit.velocity.y + dir.y * imp * m - imp * 0.2 * m });
    if (hit.label === 'player') zapHit(hit.player, dmg * m, p); // CONDUCTION on Wet targets
  }
  return { hit, pt };
}

function summonCritter(p, o = {}) {
  const b = createCircle(
    o.x ?? p.body.position.x + p.facing * 34,
    o.y ?? p.body.position.y - 10,
    o.r ?? 8,
    { density: 0.002, friction: 0.5, restitution: o.rest ?? 0.4, label: 'critter' }
  );
  b.critter = { hopAt: 0, dir: o.dir ?? p.facing, hop: o.hop ?? 6, speed: o.speed ?? 4 };
  b.owner = p;
  return summon(b, { life: o.life ?? 4500, color: o.color, contactDamage: o.dmg, contactExplode: o.boom });
}

export function frontPos(p, dist, up = 0) {
  return {
    x: Math.max(30, Math.min(W - 30, p.body.position.x + p.facing * dist)),
    y: p.body.position.y - up,
  };
}

// ============ BOLTS & BOMBS ============
regSpell('ember', { name: 'Ember Shot', color: '#ff9d5c', cooldown: 250, cast(p) { boomBolt(p, { color: '#ff9d5c', r: 4, speed: 23, vy: -3, radius: 70, power: 10, dmg: 12 }); } });
regSpell('sunburst', { name: 'Sunburst', color: '#ffe066', cooldown: 1600, cast(p) { boomBolt(p, { color: '#ffe066', r: 14, speed: 13, vy: -7, radius: 240, power: 30, dmg: 55 }); } });
regSpell('twinfire', { name: 'Twin Fire', color: '#ff7f50', cooldown: 650, cast(p) { boomBolt(p, { color: '#ff7f50', vy: -3, radius: 100, dmg: 20 }); boomBolt(p, { color: '#ff7f50', vy: -9, radius: 100, dmg: 20 }); } });
regSpell('trishot', { name: 'Trishot', color: '#ffa07a', cooldown: 800, cast(p) { for (const vy of [-2, -6, -10]) boomBolt(p, { color: '#ffa07a', r: 5, vy, radius: 85, power: 14, dmg: 15 }); } });
regSpell('scatter', { name: 'Scattershot', color: '#ffcf99', cooldown: 900, cast(p) { for (let i = 0; i < 5; i++) boomBolt(p, { color: '#ffcf99', r: 3.5, speed: rand(16, 24), vy: rand(-10, -1), radius: 60, power: 9, dmg: 9 }); } });
regSpell('mortar', { name: 'Mortar', color: '#c9a227', cooldown: 1400, cast(p) { boomBolt(p, { color: '#c9a227', r: 10, speed: 11, vy: -14, g: 0.9, radius: 170, power: 26, dmg: 45 }); } });
regSpell('bouncer', { name: 'Bouncing Betty', color: '#7bd88f', cooldown: 1200, cast(p) { const fb = boomBolt(p, { color: '#7bd88f', r: 8, rest: 1.05, expireMs: 2500, radius: 150, power: 22, dmg: 35 }); fb.noContactBoom = true; } });
regSpell('cluster', {
  name: 'Cluster Bomb', color: '#ffad66', cooldown: 2200,
  cast(p) {
    const m = p.mega || 1;
    const fb = shoot(p, { r: 9 * m, speed: 18, vy: -7, color: '#ffad66', gravityScale: 0.5 });
    fb.onHit = () => {
      const { x, y } = fb.position;
      explode(x, y, 90 * m, 14 * m, 18 * m, p);
      for (let i = 0; i < 4; i++) {
        const bomblet = dropProjectile(p, x + rand(-20, 20), y - 10, { r: 5, vx: rand(-8, 8), vy: rand(-12, -6), color: '#ffad66', expireMs: 1500 });
        bomblet.gravityScale = 1;
        bomblet.onHit = () => explode(bomblet.position.x, bomblet.position.y, 70 * m, 11 * m, 14 * m, p);
      }
    };
  },
});
regSpell('homing', {
  name: 'Homing Wisp', color: '#c3f9ff', cooldown: 1300,
  cast(p) {
    const fb = boomBolt(p, { color: '#c3f9ff', r: 6, speed: 12, vy: -2, g: 0, radius: 110, power: 16, dmg: 28, expireMs: 3000 });
    fb.update = (self) => {
      const t = nearestEnemy(p, 1e9, self.position);
      if (!t) return;
      const dx = t.body.position.x - self.position.x, dy = t.body.position.y - self.position.y;
      const d = Math.hypot(dx, dy) || 1;
      const sp = 13;
      setVelocity(self, {
        x: self.velocity.x * 0.9 + (dx / d) * sp * 0.14,
        y: self.velocity.y * 0.9 + (dy / d) * sp * 0.14,
      });
    };
  },
});
regSpell('boomerang', {
  name: 'Boomerang Orb', color: '#d2b4de', cooldown: 1100,
  cast(p) {
    const fb = boomBolt(p, { color: '#d2b4de', r: 7, speed: 18, vy: -4, g: 0.2, radius: 110, power: 16, dmg: 26, expireMs: 2400 });
    fb.bornAt = simNow();
    fb.update = (self, now) => {
      if (!self.turned && now - fb.bornAt > 600) { self.turned = true; setVelocity(self, { x: -self.velocity.x, y: self.velocity.y - 2 }); }
    };
  },
});
regSpell('skullrocket', { name: 'Skull Rocket', color: '#e8e8e8', cooldown: 1300, cast(p) { boomBolt(p, { color: '#e8e8e8', r: 8, speed: 26, vy: 0, g: 0.15, radius: 110, power: 24, dmg: 40 }); } });
regSpell('wobble', {
  name: 'Wobble Hex', color: '#e69bff', cooldown: 900,
  cast(p) {
    const fb = boomBolt(p, { color: '#e69bff', r: 6, speed: 15, vy: 0, g: 0, radius: 110, power: 16, dmg: 24, expireMs: 2500 });
    fb.update = (self, now) => setVelocity(self, { x: self.velocity.x, y: Math.sin(now * 0.02) * 6 });
  },
});
regSpell('landmine', {
  name: 'Landmine', color: '#b8b8b8', cooldown: 2000,
  cast(p) {
    const m = p.mega || 1;
    const b = createBox(p.body.position.x + p.facing * 30, p.body.position.y + 8, 16, 8, { density: 0.003, friction: 0.9, label: 'mine' });
    b.owner = p;
    b.mineBlast = { radius: 130 * m, power: 20 * m, dmg: 35 * m };
    summon(b, { life: 12000, color: '#b8b8b8' });
  },
});
regSpell('sticky', {
  name: 'Sticky Bomb', color: '#aef05a', cooldown: 1600,
  cast(p) {
    const m = p.mega || 1;
    const fb = shoot(p, { r: 7 * m, speed: 19, vy: -5, color: '#aef05a', gravityScale: 0.5 });
    fb.keepOnHit = true;
    fb.onHit = () => {
      if (fb.stuck) return;
      fb.stuck = true;
      setType(fb, 'static');
      activeEffects.push({
        until: simNow() + 900,
        draw(now, ctx) { ctx.fillStyle = Math.sin(now * 0.03) > 0 ? '#aef05a' : '#fff'; ctx.beginPath(); ctx.arc(fb.position.x, fb.position.y, 4, 0, Math.PI * 2); ctx.fill(); },
        onEnd() { removeProjectile(fb); explode(fb.position.x, fb.position.y, 160 * m, 24 * m, 40 * m, p); },
      });
    };
  },
});
regSpell('shard', {
  name: 'Meteor Shard', color: '#ff8c5a', cooldown: 1800,
  cast(p) {
    const m = p.mega || 1;
    const t = nearestEnemy(p);
    const x = t ? t.body.position.x : frontPos(p, 250).x;
    const rock = dropProjectile(p, x + rand(-30, 30), -40, { r: 18, vy: 16, color: '#ff8c5a', density: 0.008 });
    rock.onHit = () => explode(rock.position.x, rock.position.y, 130 * m, 20 * m, 45 * m, p);
  },
});
regSpell('firecrackers', {
  name: 'Firecrackers', color: '#ff6f61', cooldown: 1700,
  cast(p) {
    const m = p.mega || 1;
    const { x, y } = p.body.position;
    const t0 = simNow();
    let i = 0;
    activeEffects.push({
      until: t0 + 1000,
      update(now) {
        if (now > t0 + i * 100 && i < 10) { i++; explode(x + rand(-110, 110), y + rand(-70, 30), 50 * m, 8 * m, 8 * m, p); }
      },
    });
  },
});
regSpell('dragonbreath', {
  name: "Dragon's Breath", color: '#ff5e3a', cooldown: 1900,
  cast(p) {
    const t0 = simNow();
    // C3: the volley's potency is decided HERE, at the cast, not six times over
    // the next 720ms as each bolt happens to fire. A HYPERSPELL proc landing
    // mid-breath used to supercharge whatever was left of it.
    const m = p.mega || 1;
    let i = 0;
    activeEffects.push({
      until: t0 + 720,
      update(now) {
        if (now > t0 + i * 120 && i < 6 && p.alive) { i++; boomBolt(p, { m, color: '#ff5e3a', r: 4, speed: rand(19, 25), vy: rand(-4, 0), g: 0.3, radius: 65, power: 9, dmg: 9 }); }
      },
    });
  },
});
regSpell('cannonball', {
  name: 'Cannonball', color: '#3d3d4d', cooldown: 1500,
  cast(p) {
    const m = p.mega || 1;
    const fb = shoot(p, { r: 13 * m, speed: 24, vy: -1, color: '#3d3d4d', gravityScale: 0.9, density: 0.012, restitution: 0.3, expireMs: 4000 });
    fb.noContactBoom = true;
    fb.contactDamage = 30 * m;
    addVelocity(p.body, { x: -p.facing * 5, y: 0 });
  },
});
regSpell('bowling', {
  name: 'Bowling Ball', color: '#4a4a5a', cooldown: 1800,
  cast(p) {
    const m = p.mega || 1;
    const fb = shoot(p, { r: 20 * m, speed: 16, vy: 2, color: '#4a4a5a', gravityScale: 1, density: 0.01, restitution: 0.1, expireMs: 3500 });
    fb.noContactBoom = true;
    fb.contactDamage = 25 * m;
  },
});
regSpell('starfall', {
  name: 'Star Fall', color: '#fff3b0', cooldown: 1600,
  cast(p) {
    const m = p.mega || 1;
    const cx = frontPos(p, 220).x;
    for (let i = 0; i < 5; i++) {
      const star = dropProjectile(p, cx + (i - 2) * 55, -40 - Math.abs(i - 2) * 30, { r: 6, vy: 15, color: '#fff3b0' });
      star.onHit = () => explode(star.position.x, star.position.y, 70 * m, 11 * m, 15 * m, p);
    }
  },
});

// ============ HITSCAN & BEAMS ============
regSpell('zapspell', { name: 'Zap', color: '#fdfd96', cooldown: 350, beam: true, cast(p) { zapRay(p, 18, 10, 2); sfx.lightning(); } });
regSpell('thunderlance', { name: 'Thunder Lance', color: '#fffacd', cooldown: 1800, beam: true, cast(p) { zapRay(p, 85, 40, 6); sfx.lightning(); doFlash('#ffffff', 0.4); slowMo(0.05, 90); addShake(9); } });
regSpell('chain', {
  name: 'Chain Lightning', color: '#e3f265', cooldown: 1500,
  cast(p) {
    const m = p.mega || 1;
    sfx.lightning();
    let from = p.body.position, cur = p, dmg = 35;
    const hitSet = new Set([p]);
    for (let hop = 0; hop < 3; hop++) {
      let best = null, bd = hop === 0 ? 500 : 400;
      for (const q of players) {
        if (!q.alive || hitSet.has(q)) continue;
        const d = Math.hypot(q.body.position.x - from.x, q.body.position.y - from.y);
        if (d < bd) { bd = d; best = q; }
      }
      if (!best) break;
      hitSet.add(best);
      boltVisual(from.x, from.y - 8, best.body.position.x, best.body.position.y, '#e3f265', 3 * m);
      damagePlayer(best, dmg * m);
      addVelocity(best.body, { x: rand(-6, 6), y: -8 });
      from = best.body.position;
      dmg -= 10;
    }
  },
});
regSpell('skysmite', {
  name: 'Sky Smite', color: '#fff89e', cooldown: 1700,
  cast(p) {
    const m = p.mega || 1;
    const t = nearestEnemy(p);
    const x = t ? t.body.position.x : frontPos(p, 200).x;
    // telegraphed: the spot is marked for half a second BEFORE the bolt falls —
    // the smite has to be dodged, not auto-landed
    const gy = groundYAt(x);
    spawnText(x, gy - 44, '⚡', '#fff89e');
    spawnParticles(x, gy - 8, '#fff89e', 6, 2, 30);
    const t0 = simNow();
    activeEffects.push({
      until: t0 + 550,
      draw(now, ctx) {
        ctx.strokeStyle = '#fff89e';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.35 + 0.4 * Math.abs(Math.sin(now * 0.02));
        ctx.beginPath(); ctx.arc(x, gy - 8, 26, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      },
      onEnd() { skyBolt(x, 45, p, m); },
    });
  },
});
regSpell('sweep', { name: 'Laser Sweep', color: '#ffef99', cooldown: 1300, beam: true, cast(p) { for (const ao of [-0.16, 0, 0.16]) zapRay(p, 20, 12, 2, ao); sfx.lightning(); } });
regSpell('disintegrate', {
  name: 'Disintegrate', color: '#ff4df0', cooldown: 2400, beam: true,
  cast(p) {
    const m = p.mega || 1;
    const { x, y } = p.body.position;
    const dir = aimDir(p, 1, 0);
    boltVisual(x + dir.x * 16, y - 6 + dir.y * 16, x + dir.x * 1500, y - 6 + dir.y * 1500, '#ff4df0', 5 * m, 180);
    sfx.lightning();
    doFlash('#ff4df0', 0.2);
    // the beam is a 1500px segment 26px to either side. queryCapsule rounds off
    // the two ends, so it is the coarse pass and the exact rectangle — t within
    // the beam's length, |perpendicular| within its half-width — still decides.
    const muzzle = { x, y: y - 6 };
    const tip = { x: x + dir.x * 1500, y: y - 6 + dir.y * 1500 };
    for (const b of queryCapsule(muzzle, tip, 26, { filter: (b) => loose(b) && b !== p.body })) {
      const rx = b.position.x - x, ry = b.position.y - (y - 6);
      const t = rx * dir.x + ry * dir.y;
      if (t < 0 || t > 1500) continue;
      if (Math.abs(rx * dir.y - ry * dir.x) > 26) continue; // distance from the beam line
      if (b.label === 'player') { damagePlayer(b.player, 30 * m); continue; }
      // bosses take beam damage through the proper channel — never delete the
      // boss body or game.boss is left dangling and the round can't be won
      if (b.label === 'boss') { damageBoss(30 * m, b.position, p); continue; }
      spawnParticles(b.position.x, b.position.y, '#ff4df0', 8, 4);
      projectiles.delete(b); gibs.delete(b); tomes.delete(b); hats.delete(b); summons.delete(b);
      removeBody(b, true);
    }
  },
});
regSpell('stormcall', {
  name: 'Storm Call', color: '#d9e650', cooldown: 3200,
  cast(p) {
    const m = p.mega || 1;
    const t0 = simNow();
    let i = 0;
    activeEffects.push({
      until: t0 + 1300,
      update(now) { if (now > t0 + i * 240 && i < 5) { i++; skyBolt(rand(80, W - 80), 25, p, m); } },
    });
  },
});
regSpell('railgun', {
  name: 'Railgun', color: '#9ef0f0', cooldown: 2000, beam: true,
  cast(p) {
    const m = p.mega || 1;
    const { x, y } = p.body.position;
    const dir = aimDir(p, 1, 0);
    boltVisual(x + dir.x * 16, y - 6 + dir.y * 16, x + dir.x * 1500, y - 6 + dir.y * 1500, '#9ef0f0', 4 * m, 160);
    sfx.lightning();
    addShake(8);
    addVelocity(p.body, { x: -dir.x * 8, y: -dir.y * 5 });
    const muzzle = { x, y: y - 6 };
    const tip = { x: x + dir.x * 1500, y: y - 6 + dir.y * 1500 };
    for (const b of queryCapsule(muzzle, tip, 28, { filter: (b) => loose(b) && b !== p.body })) {
      const rx = b.position.x - x, ry = b.position.y - (y - 6);
      const t = rx * dir.x + ry * dir.y;
      if (t < 0 || t > 1500) continue;
      if (Math.abs(rx * dir.y - ry * dir.x) > 28) continue;
      setVelocity(b, { x: b.velocity.x + dir.x * 30 * m, y: b.velocity.y + dir.y * 30 * m - 4 });
      if (b.label === 'player') damagePlayer(b.player, 40 * m);
    }
  },
});

// ============ PUSH, PULL & AIR ============
regSpell('shove', { name: 'Shove', color: '#f0e6d2', cooldown: 500, cast(p) { const m = p.mega || 1; const t = nearestEnemy(p, 130); if (t) { addVelocity(t.body, { x: p.facing * 26 * m, y: -6 }); damagePlayer(t, 5 * m); } spawnParticles(frontPos(p, 40).x, p.body.position.y, '#f0e6d2', 8, 5); } });
regSpell('cyclone', {
  name: 'Cyclone', color: '#c8f7f7', cooldown: 1400,
  cast(p) {
    const m = p.mega || 1;
    const { x, y } = p.body.position;
    spawnRing(x, y, '#c8f7f7');
    for (const b of queryRadius({ x, y }, 220 * m, { filter: (b) => loose(b) && b !== p.body })) {
      const dx = b.position.x - x, dy = b.position.y - y;
      const d = Math.hypot(dx, dy);
      if (d === 0) continue;
      const s = (1 - d / (220 * m)) * 20 * m;
      setVelocity(b, { x: b.velocity.x + (dx / d) * s, y: b.velocity.y + (dy / d) * s - 4 });
    }
  },
});
regSpell('vortexpull', {
  name: 'Vortex', color: '#b58aff', cooldown: 1400,
  cast(p) {
    const m = p.mega || 1;
    const { x, y } = p.body.position;
    for (const b of queryRadius({ x, y }, 260 * m, { filter: (b) => loose(b) && b !== p.body })) {
      const dx = x - b.position.x, dy = y - b.position.y;
      const d = Math.hypot(dx, dy);
      if (d === 0) continue;
      const s = (1 - d / (260 * m)) * 16 * m;
      setVelocity(b, { x: b.velocity.x + (dx / d) * s, y: b.velocity.y + (dy / d) * s - 2 });
    }
    spawnRing(x, y, '#b58aff');
  },
});
regSpell('updraft', {
  name: 'Updraft', color: '#e0ffff', cooldown: 1200,
  cast(p) {
    const m = p.mega || 1;
    const x = p.body.position.x;
    // a full-height column: the region narrows it, the centre test decides it
    const reach = 130 * m;
    for (const b of queryRegion(column(x - reach, x + reach),
      { filter: (b) => loose(b) && Math.abs(b.position.x - x) <= reach })) {
      addVelocity(b, { x: 0, y: -18 * m });
    }
    for (let i = 0; i < 16; i++) particles.push({ kind: 'spark', x: x + rand(-100, 100), y: rand(100, H - 60), vx: 0, vy: -rand(8, 14), life: 20, maxLife: 20, color: '#e0ffff', r: 2 });
  },
});
regSpell('slam', {
  name: 'Seismic Slam', color: '#d1a054', cooldown: 2200,
  cast(p) {
    const m = p.mega || 1;
    setVelocity(p.body, { x: p.body.velocity.x, y: 30 });
    const e = {
      until: simNow() + 1600,
      update(now) {
        if (!p.alive) { e.until = 0; return; }
        if (now > (e.armAt ?? (e.armAt = now + 120)) && grounded(p) && p.body.velocity.y > -1) {
          explode(p.body.position.x, p.body.position.y + 10, 170 * m, 24 * m, 30 * m, p);
          e.until = 0;
        }
      },
    };
    activeEffects.push(e);
  },
});
regSpell('repulsor', {
  name: 'Repulsor Field', color: '#ffd7f0', cooldown: 3000,
  cast(p) {
    const m = p.mega || 1;
    const { x, y } = p.body.position;
    makeZone({
      x, y, r: 200 * m, life: 3000, color: '#ffd7f0',
      tick(q) {
        if (q === p) return;
        const dx = q.body.position.x - x, dy = q.body.position.y - y;
        const d = Math.hypot(dx, dy) || 1;
        // makeZone's tick fires every tick for the zone's whole life, so these
        // are sustained per-frame magnitudes like the singularity's, not a
        // one-shot cast impulse
        addVelocity(q.body, { x: (dx / d) * perSecond(2.4), y: (dy / d) * perSecond(1.2) });
      },
    });
  },
});
regSpell('magnetpalm', {
  name: 'Magnet Palm', color: '#ff9ecb', cooldown: 1100,
  cast(p) {
    const t = nearestEnemy(p, 420);
    if (!t) return;
    const dx = p.body.position.x - t.body.position.x, dy = p.body.position.y - t.body.position.y;
    const d = Math.hypot(dx, dy) || 1;
    setVelocity(t.body, { x: (dx / d) * 18, y: (dy / d) * 18 - 3 });
    damagePlayer(t, 5);
    boltVisual(p.body.position.x, p.body.position.y - 6, t.body.position.x, t.body.position.y, '#ff9ecb', 2, 100);
  },
});
regSpell('tornado', {
  name: 'Tornado', color: '#cfe8e8', cooldown: 3600,
  cast(p) {
    const m = p.mega || 1;
    const start = frontPos(p, 60);
    const e = {
      until: simNow() + 3500,
      x: start.x, vx: p.facing * 2.6,
      net: { k: 'tor', x: start.x },
      update() {
        e.x += e.vx;
        e.net.x = e.x;
        if (e.x < 40 || e.x > W - 40) e.vx = -e.vx;
        const reach = 120 * m;
        for (const b of queryRegion(column(e.x - reach, e.x + reach),
          { filter: (b) => loose(b) && Math.abs(b.position.x - e.x) <= reach })) {
          const dx = b.position.x - e.x;
          // NOTE: linear scaling is exactly right for the deterministic lift, but
          // only approximately right for the rand() noise, which accumulates as a
          // random walk — halving the amplitude while doubling the tick count
          // shrinks accumulated deviation by √2 rather than preserving it. The
          // variance-preserving form would scale by √ratio. Inert at 60Hz (the
          // ratio is 1), and still better than leaving half the expression in
          // frame units; revisit if TICK_HZ ever moves. Same in fusion.js's
          // firestorm.
          setVelocity(b, { x: b.velocity.x - Math.sign(dx) * perSecond(0.9) + perSecond(rand(-0.5, 0.5)), y: b.velocity.y - perSecond(1.5) * m });
        }
      },
      draw(now, ctx) {
        ctx.strokeStyle = 'rgba(207,232,232,0.55)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
          const yy = H - 80 - i * 90;
          const w = 26 + i * 22;
          ctx.beginPath();
          ctx.ellipse(e.x + Math.sin(now * 0.01 + i) * 8, yy, w, 12, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      },
    };
    activeEffects.push(e);
  },
});

// ============ ICE & CONTROL ============
// Ice Shard freezes without slicking the body — one of the three freezes that
// never wrote frictionAir. See the note on freezeUntil in player/status.js.
regSpell('iceshard', { name: 'Ice Shard', color: '#bfe8ff', cooldown: 400, cast(p) { statusBolt(p, { color: '#bfe8ff', r: 4, speed: 23, vy: -2, dmg: 12 }, (q) => { freezeUntil(q, simNow() + 450); }); } });
regSpell('glacier', {
  name: 'Glacier', color: '#9be7ff', cooldown: 2600,
  cast(p) {
    const m = p.mega || 1;
    const pos = frontPos(p, 70);
    const wall = createBox(pos.x, pos.y - 30, 26 * m, 120 * m, { isStatic: true, friction: 0.01, label: 'wall' });
    summon(wall, { life: 4500, color: '#9be7ff' });
    sfx.freeze();
  },
});
regSpell('blizzard', {
  name: 'Blizzard', color: '#d8f4ff', cooldown: 4000,
  cast(p) {
    const m = p.mega || 1;
    const pos = frontPos(p, 170);
    makeZone({
      x: pos.x, y: pos.y, r: 240 * m, life: 3200, color: '#d8f4ff',
      tick(q, now) {
        if (q === p) return;
        freezeUntil(q, Math.max(q.frozenUntil, now + 200)); // a chill, not a slick
        if (simRandom() < 0.02) damagePlayer(q, 3);
      },
      draw(now, ctx) {
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = '#d8f4ff';
        ctx.beginPath(); ctx.arc(pos.x, pos.y, 240 * m, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        for (let i = 0; i < 3; i++) particles.push({ kind: 'square', x: pos.x + rand(-220, 220), y: pos.y + rand(-200, 100), vx: rand(-1, 1), vy: rand(1, 3), life: 24, maxLife: 24, color: '#fff', r: 2 });
      },
    });
    sfx.freeze();
  },
});
regSpell('snowball', {
  name: 'Snowball', color: '#f4fbff', cooldown: 900,
  cast(p) {
    const m = p.mega || 1;
    const fb = shoot(p, { r: 14 * m, speed: 15, vy: -4, color: '#f4fbff', gravityScale: 0.7, density: 0.004, restitution: 0.2, expireMs: 3000 });
    fb.noContactBoom = true;
    fb.contactDamage = 8 * m;
  },
});
regSpell('flashfreeze', { name: 'Flash Freeze', color: '#e0f7ff', cooldown: 3400, cast(p) { const m = p.mega || 1; sfx.freeze(); doFlash('#bfe8ff', 0.3); for (const q of enemiesOf(p)) applyFreeze(q, simNow() + 800 * m); } });
regSpell('frostnova', {
  name: 'Frost Nova', color: '#aee4ff', cooldown: 2400,
  cast(p) {
    const m = p.mega || 1;
    spawnRing(p.body.position.x, p.body.position.y, '#aee4ff');
    sfx.freeze();
    for (const q of enemiesOf(p)) {
      const d = Math.hypot(q.body.position.x - p.body.position.x, q.body.position.y - p.body.position.y);
      if (d < 180 * m) { applyFreeze(q, simNow() + 1200 * m); damagePlayer(q, 10 * m); }
    }
  },
});
regSpell('icicledrop', {
  name: 'Icicle Drop', color: '#bfe8ff', cooldown: 2400,
  cast(p) {
    const m = p.mega || 1;
    for (const q of enemiesOf(p)) {
      const ice = createPolygon(q.body.position.x + rand(-20, 20), Math.max(30, q.body.position.y - 260), 3, 16 * m, { angle: Math.PI / 2, density: 0.006, label: 'critter' });
      summon(ice, { life: 3000, color: '#bfe8ff', contactDamage: 25 * m });
      setVelocity(ice, { x: 0, y: 6 });
    }
    sfx.freeze();
  },
});
regSpell('brainfreeze', { name: 'Brain Freeze', color: '#ceb4ff', cooldown: 3000, cast(p) { const m = p.mega || 1; for (const q of enemiesOf(p)) { q.reversedUntil = simNow() + 3000 * m; spawnText(q.body.position.x, q.body.position.y - 40, '?!', '#ceb4ff'); } sfx.freeze(); } });
// was auto-freezing the nearest wizard at ANY range — now a bolt that must land
regSpell('coldsnap', {
  name: 'Cold Snap', color: '#9be7ff', cooldown: 1800,
  cast(p) {
    statusBolt(p, { color: '#9be7ff', r: 5, speed: 19, vy: -3, dmg: 6 }, (q, m) => {
      applyFreeze(q, simNow() + 1000 * m);
      sfx.freeze();
    });
  },
});
regSpell('permafrost', { name: 'Permafrost', color: '#7fd4ff', cooldown: 2800, cast(p) { statusBolt(p, { color: '#7fd4ff', r: 9, speed: 10, vy: -3, dmg: 20 }, (q, m) => { applyFreeze(q, simNow() + 2600 * m); sfx.freeze(); }); } });

// ============ FIRE & STATUS ============
regSpell('ignite', { name: 'Ignite', color: '#ff8c5a', cooldown: 700, cast(p) { statusBolt(p, { color: '#ff8c5a', dmg: 8 }, (q, m) => { q.burnUntil = simNow() + 3000 * m; }); } });
regSpell('flamewall', {
  name: 'Flame Wall', color: '#ff5e3a', cooldown: 3000,
  cast(p) {
    const m = p.mega || 1;
    const pos = frontPos(p, 130);
    makeZone({
      x: pos.x, y: pos.y - 40, r: 90 * m, life: 3000, color: '#ff5e3a',
      tick(q, now) { if (q !== p) { q.burnUntil = Math.max(q.burnUntil || 0, now + 1200); } },
    });
  },
});
regSpell('napalm', {
  name: 'Napalm', color: '#ff7043', cooldown: 2600,
  cast(p) {
    const m = p.mega || 1;
    const fb = shoot(p, { r: 8 * m, speed: 18, vy: -6, color: '#ff7043', gravityScale: 0.5 });
    fb.onHit = () => {
      const { x, y } = fb.position;
      explode(x, y, 120 * m, 18 * m, 20 * m, p);
      makeZone({
        x, y, r: 110 * m, life: 2500, color: '#ff7043',
        tick(q, now) { q.burnUntil = Math.max(q.burnUntil || 0, now + 1000); },
      });
    };
  },
});
regSpell('phoenixdash', {
  name: 'Phoenix Dash', color: '#ffb347', cooldown: 2000, selfMove: true,
  cast(p) {
    const dir = aimDir(p, 25, 4);
    setVelocity(p.body, { x: dir.x * 25, y: dir.y * 25 - 2 });
    p.invulnUntil = simNow() + 600;
    for (let i = 0; i < 20; i++) particles.push({ kind: 'spark', x: p.body.position.x - dir.x * i * 4, y: p.body.position.y - dir.y * i * 4 + rand(-8, 8), vx: -dir.x * rand(2, 6), vy: rand(-2, 2), life: 22, maxLife: 22, color: '#ffb347', r: 2.5 });
  },
});
regSpell('volcanospell', {
  name: 'Volcano', color: '#ff5e57', cooldown: 3400,
  cast(p) {
    const m = p.mega || 1;
    const pos = frontPos(p, 190);
    const gy = groundYAt(pos.x);
    explode(pos.x, gy, 90 * m, 14 * m, 18 * m, p);
    for (let i = 0; i < 6; i++) {
      const rock = dropProjectile(p, pos.x + rand(-20, 20), gy - 20, { r: 8, vx: rand(-9, 9), vy: -rand(12, 20), color: '#ff5e57', density: 0.005, expireMs: 3000 });
      rock.gravityScale = 1;
      rock.noContactBoom = true;
      rock.contactDamage = 20 * m;
    }
  },
});
regSpell('fireflies', {
  name: 'Firefly Swarm', color: '#ffe066', cooldown: 2600,
  cast(p) {
    for (let i = 0; i < 6; i++) {
      const fb = shoot(p, { r: 3, speed: rand(6, 10), vy: rand(-8, 0), color: '#ffe066', gravityScale: 0, expireMs: 3500 });
      fb.onHit = (self, other) => {
        spawnParticles(self.position.x, self.position.y, '#ffe066', 6, 3);
        if (other && other.label === 'player') { damagePlayer(other.player, 6); other.player.burnUntil = simNow() + 1200; }
      };
      fb.update = (self) => {
        const t = nearestEnemy(p, 1e9, self.position);
        if (!t) return;
        const dx = t.body.position.x - self.position.x, dy = t.body.position.y - self.position.y;
        const d = Math.hypot(dx, dy) || 1;
        setVelocity(self, { x: self.velocity.x * 0.92 + (dx / d) * 1.6, y: self.velocity.y * 0.92 + (dy / d) * 1.6 });
      };
    }
  },
});

// ============ MOVEMENT & SELF ============
regSpell('blink', {
  name: 'Blink', color: '#c3b1e1', cooldown: 1300, selfMove: true,
  cast(p) {
    spawnParticles(p.body.position.x, p.body.position.y, '#c3b1e1', 14, 5);
    const dir = aimDir(p, 1, 0);
    const nx = Math.max(30, Math.min(W - 30, p.body.position.x + dir.x * 220));
    const ny = Math.max(40, Math.min(H - 60, p.body.position.y + dir.y * 160));
    setPosition(p.body, { x: nx, y: ny });
    p.invulnUntil = simNow() + 300;
    spawnParticles(nx, ny, '#c3b1e1', 14, 5);
    sfx.pickup();
  },
});
regSpell('rocketleap', {
  name: 'Rocket Leap', color: '#ffab76', cooldown: 2000, selfMove: true,
  cast(p) {
    const m = p.mega || 1;
    explode(p.body.position.x, p.body.position.y + 16, 120 * m, 18 * m, 15 * m, p);
    setVelocity(p.body, { x: p.body.velocity.x, y: -26 });
  },
});
regSpell('ghostwalk', { name: 'Ghost Walk', color: '#e8e8ff', cooldown: 4000, cast(p) { p.speedUntil = simNow() + 1500; p.invulnUntil = simNow() + 1500; spawnText(p.body.position.x, p.body.position.y - 44, 'GHOSTLY', '#e8e8ff'); } });
regSpell('swaphex', {
  name: 'Swap Hex', color: '#f5b7ff', cooldown: 3200,
  cast(p) {
    const others = enemiesOf(p);
    if (!others.length) return;
    const t = pick(others);
    const a = { ...p.body.position }, b = { ...t.body.position };
    setPosition(p.body, b);
    setPosition(t.body, a);
    spawnParticles(a.x, a.y, '#f5b7ff', 12, 5);
    spawnParticles(b.x, b.y, '#f5b7ff', 12, 5);
    spawnText(b.x, b.y - 44, 'SWAP!', '#f5b7ff');
    sfx.pickup();
  },
});
regSpell('timeskip', { name: 'Time Skip', color: '#b0e0e6', cooldown: 5000, cast(p) { slowMo(0.35, 1300); p.speedUntil = simNow() + 1300; doFlash('#b0e0e6', 0.2); } });
regSpell('smokebomb', {
  name: 'Smoke Bomb', color: '#9a9ab0', cooldown: 1800, selfMove: true,
  cast(p) {
    spawnParticles(p.body.position.x, p.body.position.y, '#9a9ab0', 30, 5, 60);
    const nx = Math.max(30, Math.min(W - 30, p.body.position.x - p.facing * 170));
    setPosition(p.body, { x: nx, y: p.body.position.y - 10 });
    p.invulnUntil = simNow() + 400;
  },
});
regSpell('springheel', { name: 'Springheel', color: '#baffc9', cooldown: 5500, cast(p) { p.jumpBoostUntil = simNow() + 5000; spawnText(p.body.position.x, p.body.position.y - 44, 'BOING!', '#baffc9'); sfx.boing(); } });
// its own gentle status, NOT floaty — floaty is 1.5x anti-gravity (net lift, the
// balloon-hex drift), which made a self-buff hurl its caster into the sky
regSpell('featherfall', { name: 'Feather Fall', color: '#fffde7', cooldown: 5000, cast(p) { p.featherUntil = simNow() + 4000; spawnText(p.body.position.x, p.body.position.y - 44, 'FEATHER-LIGHT', '#fffde7'); } });
regSpell('secondwind', { name: 'Second Wind', color: '#7bd88f', cooldown: 6000, cast(p) { healPlayer(p, 35); spawnParticles(p.body.position.x, p.body.position.y, '#7bd88f', 16, 4); } });
regSpell('aegis', { name: 'Aegis', color: '#ffd700', cooldown: 6000, cast(p) { p.invulnUntil = simNow() + 2500; sfx.pickup(); } });

// ============ SUMMONS ============
regSpell('cratedrop', {
  name: 'Crate Drop', color: '#b08948', cooldown: 2200,
  cast(p) {
    const pos = frontPos(p, 190);
    for (let i = 0; i < 3; i++) {
      const crate = createBox(pos.x + (i - 1) * 34, -40 - i * 30, 26, 26, { density: 0.003, friction: 0.4, label: 'crate' });
      crate.owner = p;
      summon(crate, { life: 9000, contactDamage: 14 }); // heavy enough to crush on impact
      setVelocity(crate, { x: 0, y: 9 });           // drop fast
    }
  },
});
regSpell('anvil', {
  name: 'Anvil', color: '#2f2f3a', cooldown: 2800,
  cast(p) {
    const m = p.mega || 1;
    const t = nearestEnemy(p);
    const x = t ? t.body.position.x : frontPos(p, 200).x;
    const anvil = createBox(x, -40, 44 * m, 26 * m, { density: 0.02, friction: 0.8, label: 'anvil' });
    summon(anvil, { life: 5000, color: '#2f2f3a', contactDamage: 55 * m });
    sfx.clang();
  },
});
regSpell('piano', {
  name: 'Grand Piano', color: '#14141c', cooldown: 4200,
  cast(p) {
    const m = p.mega || 1;
    const t = nearestEnemy(p);
    const x = t ? t.body.position.x : frontPos(p, 200).x;
    const piano = createBox(x, -60, 84 * m, 44 * m, { density: 0.018, friction: 0.8, label: 'piano' });
    summon(piano, { life: 5500, color: '#14141c', contactDamage: 80 * m });
    sfx.clang();
    setBanner('🎹', '#fff', 700);
  },
});
regSpell('bouncycastle', {
  name: 'Bouncy Castle', color: '#ffb3de', cooldown: 3000,
  cast(p) {
    for (let i = 0; i < 3; i++) {
      const ball = createCircle(p.body.position.x + p.facing * (50 + i * 30), p.body.position.y - 40 - i * 20, 14, { density: 0.001, restitution: 1.35, friction: 0.01, label: 'bouncy' });
      ball.owner = p;
      summon(ball, { life: 6000, color: '#ffb3de', contactDamage: 13 });
      setVelocity(ball, { x: p.facing * rand(6, 12), y: -rand(3, 9) });
    }
    sfx.boing();
  },
});
regSpell('stonewall', {
  name: 'Stone Wall', color: '#6b6b7a', cooldown: 2800,
  cast(p) {
    const m = p.mega || 1;
    const pos = frontPos(p, 80);
    const wall = createBox(pos.x, pos.y - 30, 30 * m, 130 * m, { isStatic: true, friction: 0.6, label: 'wall' });
    summon(wall, { life: 5500, color: '#6b6b7a' });
  },
});
regSpell('trampoline', {
  name: 'Trampoline', color: '#ff8fc7', cooldown: 3200,
  cast(p) {
    const pos = frontPos(p, 90);
    const gy = groundYAt(pos.x);
    const tramp = createBox(pos.x, gy - 8, 100, 14, { isStatic: true, restitution: 0.4, friction: 0.1, label: 'tramp' });
    summon(tramp, { life: 7000, color: '#ff8fc7' });
    sfx.boing();
  },
});
regSpell('decoy', {
  name: 'Mirror Image', color: '#e8d5ff', cooldown: 3400,
  cast(p) {
    for (const dir of [-1, 1]) {
      const d = createCircle(p.body.position.x + dir * 40, p.body.position.y - 10, 15, { density: 0.004, friction: 0.05, restitution: 0.2, label: 'decoy' });
      d.decoyOf = p;
      summon(d, { life: 5000 });
      setVelocity(d, { x: dir * rand(3, 7), y: -5 });
    }
  },
});
regSpell('beehive', {
  name: 'Beehive', color: '#e8b647', cooldown: 4200,
  cast(p) {
    const pos = frontPos(p, 120);
    const hive = createBox(pos.x, pos.y - 20, 22, 26, { density: 0.002, friction: 0.6, label: 'hive' });
    summon(hive, { life: 3000, color: '#e8b647' });
    const t0 = simNow();
    let i = 0;
    activeEffects.push({
      until: t0 + 2200,
      update(now) {
        if (now > t0 + i * 260 && i < 8) {
          i++;
          const bee = shoot(p, { r: 2.5, speed: rand(4, 7), vy: rand(-6, -2), color: '#ffe066', gravityScale: 0, expireMs: 3000 });
          setPosition(bee, { x: hive.position.x, y: hive.position.y - 10 });
          bee.onHit = (self, other) => { if (other && other.label === 'player') damagePlayer(other.player, 7, p); };
          bee.update = (self) => {
            const t = nearestEnemy(p, 1e9, self.position);
            if (!t) return;
            const dx = t.body.position.x - self.position.x, dy = t.body.position.y - self.position.y;
            const d = Math.hypot(dx, dy) || 1;
            setVelocity(self, { x: self.velocity.x * 0.9 + (dx / d) * 1.8, y: self.velocity.y * 0.9 + (dy / d) * 1.8 });
          };
        }
      },
    });
  },
});
regSpell('boulder', {
  name: 'Boulder', color: '#5a5245', cooldown: 3000,
  cast(p) {
    const m = p.mega || 1;
    const t = nearestEnemy(p);
    const x = t ? t.body.position.x + rand(-40, 40) : frontPos(p, 220).x;
    const rock = createCircle(x, -50, 26 * m, { density: 0.012, friction: 0.4, restitution: 0.2, label: 'boulderS' });
    summon(rock, { life: 6000, color: '#5a5245', contactDamage: 35 * m });
  },
});
regSpell('sawblade', {
  name: 'Sawblade', color: '#c0c0cc', cooldown: 2400,
  cast(p) {
    const m = p.mega || 1;
    const saw = createCircle(p.body.position.x + p.facing * 36, p.body.position.y, 15 * m, { density: 0.004, friction: 0.9, restitution: 0.4, label: 'saw' });
    saw.owner = p;
    saw.sawDir = p.facing;
    summon(saw, { life: 3500, color: '#c0c0cc', contactDamage: 18 * m });
    setVelocity(saw, { x: p.facing * 13, y: -2 });
    setAngularVelocity(saw, p.facing * 0.9);
  },
});
regSpell('blackcat', {
  name: 'Black Cat', color: '#1a1a24', cooldown: 3000,
  cast(p) {
    const m = p.mega || 1;
    const cat = summonCritter(p, { color: '#1a1a24', r: 8, hop: 5, speed: 7, life: 5000 });
    cat.contactExplode = { radius: 120 * m, power: 18 * m, dmg: 30 * m };
  },
});
regSpell('rubberduck', {
  name: 'Rubber Duck', color: '#ffd700', cooldown: 1600,
  cast(p) {
    summonCritter(p, { color: '#ffd700', r: 9, hop: 8, speed: 5, life: 6000, rest: 0.9, dmg: 9 });
    spawnText(p.body.position.x + p.facing * 40, p.body.position.y - 30, 'QUACK', '#ffd700');
    sfx.squeak();
  },
});

// ============ CHAOS & GLOBAL ============
regSpell('gravflip', {
  name: 'Gravity Flip', color: '#c084fc', cooldown: 6000,
  cast(p) {
    // the world flips — except the caster, who keeps their footing
    p.gravityLockDir = gravityY() < 0 ? -1 : 1;
    p.gravityLockUntil = simNow() + 2500;
    // A modifier, not a write: it flips whatever gravity currently is, so it
    // composes with a live Moon Gravity instead of cancelling it, and a map
    // cycling its base underneath cannot erase it.
    const id = pushGravity({ kind: 'flip' });
    doFlash('#c084fc', 0.3);
    setBanner('GRAVITY!', '#c084fc', 1000);
    activeEffects.push({ until: simNow() + 2500, onEnd() { popGravity(id); } });
  },
});
regSpell('moongrav', {
  name: 'Moon Gravity', color: '#d8d8f0', cooldown: 6000,
  cast() {
    // Two overlapping casts are two modifiers: each expires on its own timer.
    const id = pushGravity({ kind: 'scale', value: 0.3 });
    setBanner('LOW GRAVITY', '#d8d8f0', 1000);
    activeEffects.push({ until: simNow() + 4000, onEnd() { popGravity(id); } });
  },
});
regSpell('earthquake', {
  name: 'Earthquake', color: '#a0785a', cooldown: 4000,
  cast(p) {
    addShake(24);
    sfx.explosion();
    for (const b of allBodies()) {
      if (b.isStatic || b.isSensor) continue;
      addVelocity(b, { x: rand(-8, 8), y: -rand(2, 10) });
    }
  },
});
regSpell('poltergeist', {
  name: 'Poltergeist', color: '#b39ddb', cooldown: 3600,
  cast(p) {
    const m = p.mega || 1;
    // gather loose props near the caster; if the arena is bare, conjure some so it always erupts
    //
    // RIM: the hand-rolled test here was `< 520` and the facade's is `<= 520`,
    // one of the three sites in the task 9 conversion that is not byte-identical
    // (the others are makeZone in spells/core.js and the ghost carry search in
    // player/ghost.js). It takes a prop whose centre sits exactly 520 away to
    // the last bit of a double to tell them apart. The inclusive form is also
    // the one the other nine area spells already wrote, as `if (d > R) continue`.
    const props = queryRadius(p.body.position, 520,
      { filter: (b) => loose(b) && b.label !== 'player' && b.label !== 'boss' });
    if (props.length < 5) {
      for (let i = 0; i < 6; i++) {
        const junk = createPolygon(p.body.position.x + rand(-70, 70), p.body.position.y - rand(20, 90), pick([3, 4, 5, 6]), rand(9, 16), { density: 0.0025, frictionAir: 0.01, label: 'ball' });
        junk.color = '#b39ddb'; junk.owner = p;
        summon(junk, { life: 4000, color: '#b39ddb', contactDamage: 12 * m });
        props.push(junk);
      }
    }
    spawnRing(p.body.position.x, p.body.position.y, '#b39ddb');
    for (const b of props) {
      const t = nearestEnemy(p, 1e9, b.position);
      if (!t) break;
      const dx = t.body.position.x - b.position.x, dy = t.body.position.y - b.position.y;
      const d = Math.hypot(dx, dy) || 1;
      setVelocity(b, { x: (dx / d) * 18, y: (dy / d) * 18 - 3 });
      if (simRandom() < 0.5) spawnParticles(b.position.x, b.position.y, '#b39ddb', 3, 2, 16);
    }
  },
});
regSpell('disarm', { name: 'Butterfingers', color: '#f5deb3', cooldown: 4500, cast(p) { for (const q of enemiesOf(p)) { disarmPlayer(q); spawnText(q.body.position.x, q.body.position.y - 44, 'DISARMED', '#f5deb3'); } } });
regSpell('roulette', {
  name: 'Roulette', color: '#ff6b81', cooldown: 1000,
  cast(p) {
    const k = pick(roulettePool());
    spawnText(p.body.position.x, p.body.position.y - 52, SPELLS[k].name.toUpperCase() + '?!', SPELLS[k].color);
    SPELLS[k].cast(p);
  },
});
regSpell('chaostheory', {
  name: 'Chaos Theory', color: '#ff4df0', cooldown: 5000,
  cast() {
    doFlash('#ff4df0', 0.3);
    for (const q of players) {
      if (!q.alive) continue;
      spawnParticles(q.body.position.x, q.body.position.y, '#ff4df0', 10, 4);
      setPosition(q.body, { x: rand(100, W - 100), y: rand(80, 300) });
      setVelocity(q.body, { x: 0, y: 0 });
      spawnParticles(q.body.position.x, q.body.position.y, '#ff4df0', 10, 4);
    }
  },
});
regSpell('bigbang', {
  name: 'Big Bang', color: '#fff3d6', cooldown: 6000,
  cast(p) {
    const m = p.mega || 1;
    doFlash('#fff3d6', 0.5);
    slowMo(0.15, 400);
    explode(p.body.position.x, p.body.position.y, 400 * m, 34 * m, 60 * m, p);
  },
});
regSpell('frograin', {
  name: 'Rain of Frogs', color: '#7bd88f', cooldown: 4200,
  cast(p) {
    for (let i = 0; i < 8; i++) {
      summonCritter(p, { color: '#7bd88f', r: 7, hop: 9, speed: 3, life: 6000, x: rand(100, W - 100), y: -30 - i * 25, dir: pick([-1, 1]), dmg: 4 });
    }
    setBanner('RIBBIT', '#7bd88f', 800);
  },
});
regSpell('confetti', {
  name: 'Confetti Cannon', color: '#ff9ff3', cooldown: 500,
  cast(p) {
    const m = p.mega || 1;
    for (let i = 0; i < 24; i++) {
      particles.push({ kind: 'confetti', x: p.body.position.x + p.facing * 20, y: p.body.position.y - 8, vx: p.facing * rand(4, 14), vy: rand(-8, 2), life: 60, maxLife: 60, color: pick(['#4ecdc4', '#ff6b81', '#ffd166', '#a55eea', '#e8d5ff']), r: 4 });
    }
    const t = nearestEnemy(p, 200 * m);
    if (t && Math.sign(t.body.position.x - p.body.position.x) === p.facing) {
      addVelocity(t.body, { x: p.facing * 14 * m, y: -5 });
    }
    sfx.squeak();
  },
});
regSpell('kingsdecree', { name: "King's Decree", color: '#ffd700', cooldown: 5000, cast(p) { const m = p.mega || 1; for (const q of enemiesOf(p)) { q.shrinkUntil = simNow() + 4000 * m; spawnText(q.body.position.x, q.body.position.y - 44, 'SHRUNK', '#ffd700'); } setBanner('BY ROYAL DECREE', '#ffd700', 1100); } });
regSpell('midas', {
  name: 'Midas Touch', color: '#ffd700', cooldown: 3400,
  cast(p) {
    const m = p.mega || 1;
    const t = nearestEnemy(p, 320);
    if (!t) return;
    const now = simNow(), dur = 2000 * m;
    applyFreeze(t, now + dur);
    t.heavyUntil = now + dur; // solid gold — heavy
    spawnParticles(t.body.position.x, t.body.position.y, '#ffd700', 20, 5);
    spawnText(t.body.position.x, t.body.position.y - 44, 'GOLD!', '#ffd700');
    // the golden statue shatters when it wears off, for bonus damage
    activeEffects.push({ until: now + dur, onEnd() {
      if (!t.alive) return;
      damagePlayer(t, 16 * m, p);
      spawnParticles(t.body.position.x, t.body.position.y, '#ffd700', 22, 7);
      spawnText(t.body.position.x, t.body.position.y - 44, 'SHATTER!', '#ffd700');
      sfx.freeze?.();
    } });
  },
});

// ============ WEIRD & OUTLANDISH ============
regSpell('banana', {
  name: 'Banana Peel', color: '#ffe135', cooldown: 1400,
  cast(p) {
    const pos = frontPos(p, 60);
    const peel = createBox(pos.x, pos.y, 16, 6, { density: 0.001, friction: 0.05, label: 'banana' });
    peel.owner = p;
    summon(peel, { life: 10000, color: '#ffe135', armAt: simNow() + 700 });
  },
});
regSpell('yoink', {
  name: 'Yoink', color: '#7ae7c7', cooldown: 1600,
  cast(p) {
    let target = null, bd = 1e9;
    for (const t of [...tomes, ...hats]) {
      const d = Math.hypot(t.position.x - p.body.position.x, t.position.y - p.body.position.y);
      if (d < bd) { bd = d; target = t; }
    }
    if (target) {
      const dx = p.body.position.x - target.position.x, dy = p.body.position.y - target.position.y;
      const d = Math.hypot(dx, dy) || 1;
      setVelocity(target, { x: (dx / d) * 20, y: (dy / d) * 20 - 2 });
      boltVisual(p.body.position.x, p.body.position.y, target.position.x, target.position.y, '#7ae7c7', 2, 100);
      spawnText(p.body.position.x, p.body.position.y - 44, 'YOINK!', '#7ae7c7');
    } else {
      const t = nearestEnemy(p, 500);
      if (t) {
        const dx = p.body.position.x - t.body.position.x, dy = p.body.position.y - t.body.position.y;
        const d = Math.hypot(dx, dy) || 1;
        setVelocity(t.body, { x: (dx / d) * 16, y: (dy / d) * 16 - 3 });
        spawnText(p.body.position.x, p.body.position.y - 44, 'YOINK!', '#7ae7c7');
      }
    }
  },
});
regSpell('unoreverse', { name: 'Uno Reverse', color: '#4ecdff', cooldown: 5000, cast(p) { p.reflectUntil = simNow() + 3000; spawnText(p.body.position.x, p.body.position.y - 44, 'REVERSE!', '#4ecdff'); } });
// balloon/anchor were auto-hitting the nearest wizard at ANY range with nothing
// to dodge — overpowered. Now they're bolts like every other hex: the shot has
// to actually land, so you can dodge it or parry it right back.
regSpell('balloonhex', {
  name: 'Balloon Hex', color: '#ff6b81', cooldown: 2600,
  cast(p) {
    statusBolt(p, { color: '#ff6b81', r: 6, speed: 16, vy: -4, dmg: 5 }, (q, m) => {
      q.floatyUntil = simNow() + 1800 * m;
      setVelocity(q.body, { x: q.body.velocity.x, y: -7 });
      spawnText(q.body.position.x, q.body.position.y - 44, 'UP UP', '#ff6b81');
      sfx.boing?.();
    });
  },
});
regSpell('anchorhex', {
  name: 'Anchor Hex', color: '#5a6b7a', cooldown: 2600,
  cast(p) {
    statusBolt(p, { color: '#5a6b7a', r: 6, speed: 16, vy: -4, dmg: 5 }, (q, m) => {
      q.heavyUntil = simNow() + 2600 * m;
      setVelocity(q.body, { x: q.body.velocity.x, y: 11 });
      spawnText(q.body.position.x, q.body.position.y - 44, 'HEAVY', '#5a6b7a');
      sfx.thud?.();
    });
  },
});
regSpell('shrinkray', { name: 'Shrink Ray', color: '#98fb98', cooldown: 2200, cast(p) { statusBolt(p, { color: '#98fb98', dmg: 10 }, (q, m) => { q.shrinkUntil = simNow() + 4000 * m; spawnText(q.body.position.x, q.body.position.y - 40, 'tiny!', '#98fb98'); }); } });
regSpell('growthspurt', { name: 'Growth Spurt', color: '#a7e88f', cooldown: 5000, cast(p) { p.growUntil = simNow() + 4000; spawnText(p.body.position.x, p.body.position.y - 50, 'BIG!', '#a7e88f'); } });
regSpell('mirrorcast', {
  name: 'Mirror Cast', color: '#dcdcf0', cooldown: 1200,
  cast(p) {
    const t = nearestEnemy(p);
    const src = t && t.spellId;
    const id = mirrorEligible(src) ? src : null;
    if (!id) {
      spawnText(p.body.position.x, p.body.position.y - 52, 'NOTHING!', '#dcdcf0');
      return;
    }
    spawnText(p.body.position.x, p.body.position.y - 52, SPELLS[id].name.toUpperCase(), SPELLS[id].color);
    SPELLS[id].cast(p);
  },
});
regSpell('vampirebolt', {
  name: 'Vampire Bolt', color: '#c2185b', cooldown: 1400,
  cast(p) {
    const m = p.mega || 1;
    const fb = shoot(p, { r: 7 * m, speed: 19, vy: -5, color: '#c2185b', gravityScale: 0.5 });
    fb.onHit = (self, other) => {
      spawnParticles(self.position.x, self.position.y, '#c2185b', 10, 4);
      if (other && other.label === 'player') {
        damagePlayer(other.player, 25 * m);
        healPlayer(p, 25 * m);
      }
    };
  },
});
regSpell('lifeswap', {
  name: 'Life Swap', color: '#ff80ab', cooldown: 5000,
  cast(p) {
    const fb = shoot(p, { r: 8, speed: 17, vy: -5, color: '#ff80ab', gravityScale: 0.5 });
    fb.onHit = (self, other) => {
      spawnParticles(self.position.x, self.position.y, '#ff80ab', 12, 4);
      if (other && other.label === 'player' && other.player.alive && p.alive) {
        const q = other.player;
        const tmp = p.hp;
        p.hp = q.hp;
        q.hp = tmp;
        spawnText(p.body.position.x, p.body.position.y - 44, `${Math.round(p.hp)}HP`, '#ff80ab');
        spawnText(q.body.position.x, q.body.position.y - 44, `${Math.round(q.hp)}HP`, '#ff80ab');
      }
    };
  },
});
regSpell('pigmorph', {
  name: 'Pig Morph', color: '#ff9ecb', cooldown: 3000,
  cast(p) {
    statusBolt(p, { color: '#ff9ecb', dmg: 5 }, (q, m) => {
      q.pigUntil = simNow() + 3800 * m; // long enough to actually be a pig (no casting)
      spawnText(q.body.position.x, q.body.position.y - 44, 'OINK!', '#ff9ecb');
      sfx.oink();
    });
  },
});
regSpell('lightningrod', {
  name: 'Lightning Rod', color: '#e3f265', cooldown: 5000,
  cast(p) {
    const m = p.mega || 1;
    const pos = frontPos(p, 140);
    const gy = groundYAt(pos.x);
    const rod = createBox(pos.x, gy - 40, 8, 80, { isStatic: true, label: 'wall' });
    summon(rod, { life: 5000, color: '#e3f265' });
    const t0 = simNow();
    let next = t0 + 700;
    activeEffects.push({
      until: t0 + 5000,
      update(now) {
        if (now > next && summons.has(rod)) {
          next = now + 900;
          skyBolt(rod.position.x + rand(-40, 40), 25, p, m);
        }
      },
    });
  },
});
regSpell('teslacoil', {
  name: 'Tesla Coil', color: '#9ef0f0', cooldown: 4800,
  cast(p) {
    const m = p.mega || 1;
    const pos = frontPos(p, 110);
    const gy = groundYAt(pos.x);
    const coil = createBox(pos.x, gy - 25, 14, 50, { isStatic: true, label: 'wall' });
    summon(coil, { life: 4000, color: '#9ef0f0' });
    const t0 = simNow();
    let next = t0 + 400;
    activeEffects.push({
      until: t0 + 4000,
      update(now) {
        if (now > next && summons.has(coil)) {
          next = now + 500;
          for (const q of enemiesOf(p)) {
            const d = Math.hypot(q.body.position.x - coil.position.x, q.body.position.y - coil.position.y);
            if (d < 240 * m) {
              boltVisual(coil.position.x, coil.position.y - 20, q.body.position.x, q.body.position.y, '#9ef0f0', 2, 90);
              damagePlayer(q, 8 * m);
            }
          }
        }
      },
    });
  },
});
regSpell('kitchensink', {
  name: 'Kitchen Sink', color: '#d8d8e0', cooldown: 2600,
  cast(p) {
    const m = p.mega || 1;
    const fb = shoot(p, { r: 14 * m, speed: 18, vy: -5, color: '#d8d8e0', gravityScale: 0.8, density: 0.015, restitution: 0.3, expireMs: 3000 });
    fb.noContactBoom = true;
    fb.contactDamage = 45 * m;
    setAngularVelocity(fb, p.facing * 0.5);
    sfx.clang();
    spawnText(p.body.position.x, p.body.position.y - 50, 'EVERYTHING!', '#d8d8e0');
  },
});
