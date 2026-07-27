// spells/fusion.js — FUSION: two slotted spells combine into a bespoke, 1-of-a-kind
// hybrid. Each hybrid is hand-authored (name, colour, cooldown, cast). Recipes
// match on small hand-picked ingredient FAMILIES (so fusions are actually
// reachable), order-independent. A Fusion Catalyst pickup acts as a WILD
// ingredient that fuses with whatever you're holding. Hybrids are flagged so the
// tome pool never drops them — they only exist through fusion.
//
// Content file: moved verbatim from js/hybrids.js. The only edits are the module
// header below and the effect draw() closures, which now take the render surface
// as an argument instead of reaching for a global ctx.
import { Bodies, Body, Composite, world, W, H } from '../world.js';
import { perSecond, simNow } from '../time.js';
import { simRandom, rand } from '../rng.js';
import {
  spawnParticles, spawnRing, spawnText, addShake, doFlash, spawnBurst,
} from '../fx.js';
import { slowMo } from '../pace.js';
import { sfx } from '../sfx.js';
import { game, setBanner } from '../match.js';
import { healPlayer } from '../player/lifecycle.js';
import { damagePlayer } from '../player/combat.js';
import { telPick } from '../telemetry.js';
import { SPELLS } from './registry.js';
import {
  projectiles, activeEffects, aimDir, shoot, dropProjectile, summon,
  enemiesOf, nearestEnemy, explode, boltVisual, groundYAt, skyBolt,
  spawnSingularity, hybridCharges,
} from './core.js';
import { boomBolt, statusBolt, zapRay, frontPos } from './book.js';

export const WILD = '__wild__';

// filled here, merged into SPELLS by src/sim/content.js
export const HYBRID_SPELLS = {};
function regHybrid(id, def) { def.hybrid = true; HYBRID_SPELLS[id] = def; }

// ingredient families (a spell may sit in more than one; first matching recipe wins)
export const F_FIRE  = ['fireball', 'ember', 'twinfire', 'trishot', 'scatter', 'mortar', 'sunburst', 'skullrocket', 'dragonbreath', 'ignite', 'shard', 'firecrackers', 'volcanospell', 'napalm', 'flamewall', 'phoenixdash', 'starfall'];
export const F_ICE   = ['frost', 'iceshard', 'snowball', 'coldsnap', 'glacier', 'permafrost', 'blizzard', 'frostnova', 'icicledrop', 'flashfreeze'];
export const F_ZAP   = ['lightning', 'zapspell', 'thunderlance', 'chain', 'railgun', 'sweep', 'skysmite', 'teslacoil', 'lightningrod', 'stormcall'];
export const F_AIR   = ['gust', 'shove', 'cyclone', 'vortexpull', 'updraft', 'tornado', 'repulsor', 'slam', 'magnetpalm'];
export const F_EARTH = ['cratedrop', 'anvil', 'piano', 'boulder', 'stonewall', 'bowling', 'sawblade', 'cannonball'];
export const F_VOID  = ['blackhole', 'meteor', 'bigbang', 'gravflip', 'chaostheory', 'moongrav'];
export const F_LIFE  = ['secondwind', 'vampirebolt', 'aegis', 'ghostwalk'];
export const F_TRICK = ['banana', 'pigmorph', 'swaphex', 'roulette', 'shrinkray', 'balloonhex', 'anchorhex', 'unoreverse', 'wobble', 'decoy', 'blackcat', 'rubberduck', 'confetti', 'poltergeist', 'brainfreeze', 'disarm', 'kingsdecree', 'midas', 'growthspurt', 'smokebomb', 'mirrorcast', 'timeskip', 'yoink', 'lifeswap', 'frograin', 'boomerang', 'kitchensink'];

// recipes: unordered {a, b} family pair -> hybrid id. The 7 same-family entries
// are the "amplified" pure fusions (listed first, so a WILD catalyst on any spell
// resolves to its school's amp). Then all 21 cross-school pairs. Full 7x7 matrix.
export const FUSIONS = [
  // --- amplified (same-school) ---
  { id: 'inferno',        a: F_FIRE,  b: F_FIRE },
  { id: 'absolutezero',   a: F_ICE,   b: F_ICE },
  { id: 'overload',       a: F_ZAP,   b: F_ZAP },
  { id: 'maelstrom',      a: F_AIR,   b: F_AIR },
  { id: 'rockslide',      a: F_EARTH, b: F_EARTH },
  { id: 'bigcrunch',      a: F_VOID,  b: F_VOID },
  { id: 'sanctuary',      a: F_LIFE,  b: F_LIFE },
  { id: 'pandemonium',    a: F_TRICK, b: F_TRICK },
  // --- cross-school ---
  { id: 'steamburst',     a: F_FIRE,  b: F_ICE },
  { id: 'plasmalance',    a: F_FIRE,  b: F_ZAP },
  { id: 'firestorm',      a: F_FIRE,  b: F_AIR },
  { id: 'moltenmeteor',   a: F_FIRE,  b: F_EARTH },
  { id: 'blacksun',       a: F_FIRE,  b: F_VOID },
  { id: 'soulflame',      a: F_FIRE,  b: F_LIFE },
  { id: 'superconductor', a: F_ICE,   b: F_ZAP },
  { id: 'howlingblizzard',a: F_ICE,   b: F_AIR },
  { id: 'avalanche',      a: F_ICE,   b: F_EARTH },
  { id: 'frozenstar',     a: F_ICE,   b: F_VOID },
  { id: 'frostward',      a: F_ICE,   b: F_LIFE },
  { id: 'thunderstorm',   a: F_ZAP,   b: F_AIR },
  { id: 'teslashrapnel',  a: F_ZAP,   b: F_EARTH },
  { id: 'ionstorm',       a: F_ZAP,   b: F_VOID },
  { id: 'defibrillator',  a: F_ZAP,   b: F_LIFE },
  { id: 'sandstorm',      a: F_AIR,   b: F_EARTH },
  { id: 'eventhorizon',   a: F_AIR,   b: F_VOID },
  { id: 'zephyr',         a: F_AIR,   b: F_LIFE },
  { id: 'gravitywell',    a: F_EARTH, b: F_VOID },
  { id: 'bulwark',        a: F_EARTH, b: F_LIFE },
  { id: 'soulharvest',    a: F_VOID,  b: F_LIFE },
  { id: 'hexfire',        a: F_TRICK, b: F_FIRE },
  { id: 'coldfeet',       a: F_TRICK, b: F_ICE },
  { id: 'joybuzzer',      a: F_TRICK, b: F_ZAP },
  { id: 'whirligig',      a: F_TRICK, b: F_AIR },
  { id: 'boobytrap',      a: F_TRICK, b: F_EARTH },
  { id: 'realityglitch',  a: F_TRICK, b: F_VOID },
  { id: 'voodoo',         a: F_TRICK, b: F_LIFE },
];

// resolve the hybrid id for two slotted spell ids (either order), WILD matches any
export function hybridFor(x, y) {
  if (!x || !y || (x === WILD && y === WILD)) return null;
  for (const r of FUSIONS) {
    if (x === WILD) { if (r.a.includes(y) || r.b.includes(y)) return r.id; continue; }
    if (y === WILD) { if (r.a.includes(x) || r.b.includes(x)) return r.id; continue; }
    if ((r.a.includes(x) && r.b.includes(y)) || (r.a.includes(y) && r.b.includes(x))) return r.id;
  }
  return null;
}

// if the two slots form a recipe, collapse them into the hybrid (slot 0), free
// slot 1, and celebrate. Returns true if a fusion happened.
export function tryFuse(p) {
  if (!p.slots[0] || !p.slots[1]) return false;
  const id = hybridFor(p.slots[0], p.slots[1]);
  if (!id) return false;
  const def = SPELLS[id];
  const charges = hybridCharges(def); // power-scaled: heavier hybrid, fewer casts
  p.slots[0] = id; p.slots[1] = null;
  p.slotCharges[0] = charges; p.slotCharges[1] = null;
  p.casts[0] = 0; p.slotFilledAt[0] = simNow();
  p.lastCastSlot = 0;
  const { x, y } = p.body.position;
  setBanner('⚡ FUSION! ' + def.name.toUpperCase(), def.color, 1800, true);
  spawnText(x, y - 62, `${def.name.toUpperCase()}! ×${charges}`, def.color);
  spawnRing(x, y, def.color);
  spawnParticles(x, y, def.color, 28, 8);
  doFlash(def.color, 0.35);
  addShake(9);
  slowMo(0.32, 700); // a dramatic beat so the fusion actually lands on the eye
  sfx.hyper?.();
  if (game.state === 'PLAY') telPick(id); // count the hybrid for the report card
  return true;
}

// ================= the bespoke hybrids =================
// primitives: boomBolt/zapRay/statusBolt apply p.mega internally; explode/skyBolt/
// status-durations are scaled here by m. owner = p so damage credits the caster.

regHybrid('inferno', {
  name: 'Inferno', color: '#ff5e3a', cooldown: 2600,
  cast(p) {
    const m = p.mega || 1;
    for (let i = 0; i < 6; i++) {
      const fb = shoot(p, { r: 6, speed: 16, vy: 0, color: '#ff5e3a', gravityScale: 0.3, angle: (i / 6) * Math.PI * 2 });
      fb.owner = p;
      fb.onHit = () => explode(fb.position.x, fb.position.y, 90 * m, 14 * m, 22 * m, p, { selfSafe: true });
    }
    explode(p.body.position.x, p.body.position.y, 130 * m, 12 * m, 8 * m, p, { selfSafe: true });
    for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - p.body.position.x, q.body.position.y - p.body.position.y) < 320 * m) q.burnUntil = simNow() + 2500 * m;
    // bespoke: a ring of rising embers
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; spawnBurst(p.body.position.x + Math.cos(a) * 30, p.body.position.y + Math.sin(a) * 30, i % 2 ? '#ffd166' : '#ff5e3a', 4, { dir: -Math.PI / 2, spread: 1, speed: 5, up: 4, g: 0.06, life: 46 }); }
    doFlash('#ff5e3a', 0.3); addShake(7); sfx.cast();
  },
});
regHybrid('absolutezero', {
  name: 'Absolute Zero', color: '#bfe8ff', cooldown: 3000,
  cast(p) {
    const m = p.mega || 1;
    sfx.freeze(); doFlash('#bfe8ff', 0.35); addShake(6);
    for (const q of enemiesOf(p)) {
      q.frozenUntil = simNow() + 1400 * m;
      q.body.frictionAir = 0.001;
      damagePlayer(q, 14 * m, p);
      // bespoke: a burst of jagged ice shards flung outward
      spawnBurst(q.body.position.x, q.body.position.y, '#eaffff', 14, { kind: 'spark', speed: 9, r: 2.5 });
      spawnBurst(q.body.position.x, q.body.position.y, '#bfe8ff', 8, { speed: 4, r: 3 });
    }
  },
});
regHybrid('overload', {
  name: 'Overload', color: '#fffacd', cooldown: 2400, beam: true,
  cast(p) {
    for (const ao of [-0.28, -0.14, 0, 0.14, 0.28]) zapRay(p, 26, 14, 3, ao);
    // bespoke: a fan of crackling sparks
    const d = aimDir(p, 1, 0), base = Math.atan2(d.y, d.x);
    for (let i = 0; i < 18; i++) spawnBurst(p.body.position.x, p.body.position.y - 6, i % 2 ? '#fffacd' : '#ffffff', 2, { kind: 'spark', dir: base + rand(-0.35, 0.35), spread: 0.1, speed: 11, r: 2 });
    sfx.lightning(); doFlash('#ffffff', 0.4); addShake(9);
  },
});
regHybrid('steamburst', {
  name: 'Steam Burst', color: '#d7f0ea', cooldown: 1800,
  cast(p) {
    const m = p.mega || 1;
    const fb = boomBolt(p, { selfSafe: true, color: '#d7f0ea', r: 12, vy: -5, speed: 15, radius: 180, power: 22, dmg: 36 });
    const base = fb.onHit;
    fb.onHit = (self, other) => {
      base?.(self, other);
      if (other?.label === 'player' && other.player.alive) { other.player.frozenUntil = simNow() + 700 * m; other.player.body.frictionAir = 0.001; }
    };
    // bespoke: billowing steam that rises and lingers
    const sp = frontPos(p, 90, -6);
    spawnBurst(sp.x, sp.y, '#eafaf6', 22, { speed: 3.5, up: 3, g: -0.08, life: 60, r: 5 });
    spawnBurst(sp.x, sp.y, '#c8e8e0', 14, { speed: 2.2, up: 4, g: -0.06, life: 70, r: 6 });
    sfx.freeze(); doFlash('#d7f0ea', 0.15);
  },
});
regHybrid('plasmalance', {
  name: 'Plasma Lance', color: '#ff4df0', cooldown: 2000, beam: true,
  cast(p) {
    const m = p.mega || 1;
    const { hit } = zapRay(p, 52, 26, 4);
    // bespoke: a lance of magenta sparks fired along the aim
    const d = aimDir(p, 1, 0);
    for (let i = 1; i <= 8; i++) spawnBurst(p.body.position.x + d.x * i * 90, p.body.position.y - 6 + d.y * i * 90, i % 2 ? '#ff4df0' : '#ffd6fb', 3, { kind: 'spark', speed: 5, r: 2 });
    sfx.lightning(); doFlash('#ff4df0', 0.3); addShake(8);
    if (hit && hit.label === 'player') hit.player.burnUntil = simNow() + 2600 * m; // burn rides the lance
  },
});
regHybrid('superconductor', {
  name: 'Superconductor', color: '#9ef0f0', cooldown: 2400, beam: true,
  cast(p) {
    const m = p.mega || 1;
    // the freeze rides the beam — and the flash-frozen air crystallizes into a
    // REAL ice pillar at the impact point: instant cover, a wall to trap a foe
    // against, or a rude slippery platform. Summons ride the snapshot, so LAN
    // clients see the pillar too.
    const { hit, pt } = zapRay(p, 38, 10, 3);
    if (hit && hit.label === 'player') {
      hit.player.frozenUntil = simNow() + 1000 * m;
      hit.player.body.frictionAir = 0.001;
    }
    const d = aimDir(p, 1, 0);
    const px = Math.max(30, Math.min(W - 30, pt.x - d.x * 16));
    const pillar = Bodies.rectangle(px, pt.y - 42, 26 * Math.min(m, 1.5), 110 * Math.min(m, 1.5), { isStatic: true, friction: 0.01, label: 'wall' });
    summon(pillar, { life: 3500, color: '#bfe8ff' });
    spawnBurst(pt.x, pt.y, '#eaffff', 14, { kind: 'spark', speed: 8, r: 2 });
    spawnBurst(px, pt.y - 70, '#9ef0f0', 10, { speed: 3, up: 2, g: 0.04, life: 40 });
    doFlash('#9ef0f0', 0.2); addShake(5); sfx.lightning(); sfx.freeze();
  },
});
regHybrid('firestorm', {
  name: 'Firestorm', color: '#ff7043', cooldown: 2600,
  cast(p) {
    const m = p.mega || 1;
    // a living fire tornado sweeps the arena: it lifts wizards and loose junk
    // into the air and sets whoever it swallows alight. Rides the fxLite 'tor'
    // channel (tinted) so LAN clients watch the same funnel roam.
    const start = frontPos(p, 70);
    const e = {
      until: simNow() + 2400,
      x: start.x, vx: p.facing * 3.2,
      net: { k: 'tor', x: start.x, c: '#ff7043' },
      update(now) {
        e.x += e.vx;
        e.net.x = e.x;
        if (e.x < 50 || e.x > W - 50) e.vx = -e.vx;
        for (const b of Composite.allBodies(world)) {
          if (b.isStatic || b.isSensor) continue;
          if (b.label === 'player' && b.player === p) continue; // never eats the caster
          const dx = b.position.x - e.x;
          if (Math.abs(dx) > 110 * m) continue;
          Body.setVelocity(b, { x: b.velocity.x - Math.sign(dx || 1) * perSecond(0.8) + perSecond(rand(-0.5, 0.5)), y: b.velocity.y - perSecond(1.6) * m });
          if (b.label === 'player' && b.player.alive) b.player.burnUntil = Math.max(b.player.burnUntil || 0, now + 900 * m);
        }
      },
      draw(now, ctx) {
        ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
          const yy = H - 80 - i * 90, w = 24 + i * 20;
          ctx.strokeStyle = `rgba(255, ${100 + i * 26}, 60, 0.6)`;
          ctx.beginPath();
          ctx.ellipse(e.x + Math.sin(now * 0.013 + i) * 9, yy, w, 12, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      },
    };
    activeEffects.push(e);
    spawnBurst(start.x, p.body.position.y, '#ff7043', 16, { dir: -Math.PI / 2, spread: 1.2, speed: 6, up: 3, g: -0.03, life: 40 });
    doFlash('#ff7043', 0.2); addShake(6); sfx.cast();
  },
});
regHybrid('howlingblizzard', {
  name: 'Howling Blizzard', color: '#d8f4ff', cooldown: 2600,
  cast(p) {
    const m = p.mega || 1;
    const { x, y } = p.body.position;
    explode(x + p.facing * 260, y, 220, 10 * m, 18 * m, p, { selfSafe: true });
    for (const q of enemiesOf(p)) {
      if (Math.hypot(q.body.position.x - x, q.body.position.y - y) < 440) {
        q.frozenUntil = simNow() + 800 * m; q.body.frictionAir = 0.001;
        Body.setVelocity(q.body, { x: q.body.velocity.x + p.facing * 6, y: q.body.velocity.y });
      }
    }
    spawnParticles(x + p.facing * 200, y, '#d8f4ff', 22, 6); sfx.freeze();
  },
});
regHybrid('thunderstorm', {
  name: 'Thunderstorm', color: '#d9e650', cooldown: 3000,
  cast(p) {
    const m = p.mega || 1;
    const t0 = simNow(); let i = 0;
    activeEffects.push({ until: t0 + 950, update(now) { if (now > t0 + i * 180 && i < 4) { i++; skyBolt(rand(80, W - 80), 22, p, m, { selfSafe: true }); } } });
    sfx.lightning();
  },
});
regHybrid('moltenmeteor', {
  name: 'Molten Meteor', color: '#ff5e57', cooldown: 2600,
  cast(p) {
    const m = p.mega || 1;
    // cluster payload: the impact hurls out molten shards that arc away and pop
    // where they land, so even a near-miss turns the ground into a firework.
    // Shards are real projectiles — they ride the snapshot to LAN clients.
    const fb = boomBolt(p, { selfSafe: true, color: '#ff5e57', r: 14, vy: -12, speed: 12, g: 0.9, radius: 180, power: 26, dmg: 40 });
    const base = fb.onHit;
    fb.onHit = (self, other) => {
      base?.(self, other);
      if (other?.label === 'player' && other.player.alive) other.player.burnUntil = simNow() + 2200 * m;
      for (let i = 0; i < 4; i++) {
        const blob = dropProjectile(p, self.position.x + rand(-14, 14), self.position.y - 24, { r: 6, vx: rand(-9, 9), vy: rand(-10, -5), color: i % 2 ? '#ff8c5a' : '#ff5e57', density: 0.003, expireMs: 2600 });
        blob.onHit = (bSelf, bOther) => {
          explode(blob.position.x, blob.position.y, 70 * m, 9 * m, 12 * m, p, { selfSafe: true });
          if (bOther?.label === 'player' && bOther.player.alive) bOther.player.burnUntil = simNow() + 1400 * m;
        };
      }
      spawnBurst(self.position.x, self.position.y, '#ffd166', 14, { dir: -Math.PI / 2, spread: 2, speed: 8, up: 4, g: 0.12, life: 40 });
    };
    addShake(6);
  },
});
regHybrid('avalanche', {
  name: 'Avalanche', color: '#8aa0b0', cooldown: 2800,
  cast(p) {
    const m = p.mega || 1;
    const t = nearestEnemy(p);
    const tx = t ? t.body.position.x : p.body.position.x + p.facing * 300;
    // real snowpack falls (same fix as rockslide — no more invisible air-bursts):
    // ice chunks crash down, blast on impact, and flash-freeze whoever's close
    const t0 = simNow();
    let dropped = 0;
    activeEffects.push({
      until: t0 + 900,
      update(now) {
        while (dropped < 5 && now > t0 + dropped * 150) {
          dropped++;
          const rx = Math.max(60, Math.min(W - 60, tx + rand(-110, 110)));
          const chunk = dropProjectile(p, rx, -40, { r: rand(10, 15) * Math.min(m, 1.6), vy: rand(15, 19), color: dropped % 2 ? '#eaf6ff' : '#bfe8ff', density: 0.007 });
          chunk.onHit = () => {
            explode(chunk.position.x, chunk.position.y, 90 * m, 12 * m, 16 * m, p, { selfSafe: true });
            const nw = simNow();
            for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - chunk.position.x, q.body.position.y - chunk.position.y) < 120) { q.frozenUntil = Math.max(q.frozenUntil || 0, nw + 700 * m); q.body.frictionAir = 0.001; }
            spawnBurst(chunk.position.x, chunk.position.y, '#eaffff', 10, { kind: 'spark', speed: 7 });
          };
        }
      },
    });
    for (const q of enemiesOf(p)) if (Math.abs(q.body.position.x - tx) < 180) q.heavyUntil = simNow() + 1500 * m;
    addShake(9); sfx.freeze?.();
  },
});
regHybrid('teslashrapnel', {
  name: 'Tesla Shrapnel', color: '#c0c0cc', cooldown: 2200, beam: true,
  cast(p) {
    zapRay(p, 44, 30, 4); addShake(9);
    Body.setVelocity(p.body, { x: p.body.velocity.x - p.facing * 8, y: p.body.velocity.y - 4 });
    for (let i = 0; i < 3; i++) boomBolt(p, { selfSafe: true, color: '#c0c0cc', r: 4, vy: rand(-6, 0), speed: rand(18, 26), radius: 60, power: 12, dmg: 12 });
    sfx.lightning();
  },
});
regHybrid('blacksun', {
  name: 'Black Sun', color: '#a55eea', cooldown: 3400,
  cast(p) {
    const m = p.mega || 1;
    const dir = aimDir(p, 1, 0);
    const sx = p.body.position.x + dir.x * 240, sy = p.body.position.y - 40 + dir.y * 240;
    spawnSingularity(sx, sy, m, p, { selfSafe: true });
    explode(sx, sy, 160, 8 * m, 20 * m, p, { selfSafe: true });
    for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - sx, q.body.position.y - sy) < 300) q.burnUntil = simNow() + 2600 * m;
    // bespoke: a corona of violet fire swirling around a black core
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; spawnBurst(sx + Math.cos(a) * 44, sy + Math.sin(a) * 44, i % 3 ? '#ff7043' : '#a55eea', 2, { dir: a + Math.PI / 2, spread: 0.3, speed: 5, g: 0, life: 44 }); }
    doFlash('#a55eea', 0.3);
  },
});
regHybrid('eventhorizon', {
  name: 'Event Horizon', color: '#b58aff', cooldown: 3600,
  cast(p) {
    const m = p.mega || 1;
    const dir = aimDir(p, 1, 0);
    const sx = p.body.position.x + dir.x * 260, sy = p.body.position.y + dir.y * 260;
    spawnSingularity(sx, sy, m, p, { selfSafe: true });
    activeEffects.push({ until: simNow() + 720, onEnd() { explode(sx, sy, 260, 26 * m, 34 * m, p, { selfSafe: true }); addShake(12); } });
  },
});
regHybrid('soulflame', {
  name: 'Soul Flame', color: '#c2185b', cooldown: 2000,
  cast(p) {
    const m = p.mega || 1;
    const fb = shoot(p, { r: 7, speed: 18, vy: -4, color: '#c2185b', gravityScale: 0.5 });
    fb.owner = p;
    fb.onHit = (self, other) => {
      explode(self.position.x, self.position.y, 90 * m, 10 * m, 26 * m, p, { selfSafe: true });
      if (other && other.label === 'player') healPlayer(p, 16 * m);
      spawnParticles(self.position.x, self.position.y, '#c2185b', 12, 4);
    };
  },
});

// ---- amplified (same-school) fusions ----
regHybrid('maelstrom', {
  name: 'Maelstrom', color: '#c8f7f7', cooldown: 3200,
  cast(p) {
    const m = p.mega || 1;
    const { x, y } = p.body.position;
    for (const q of enemiesOf(p)) {
      const dx = x - q.body.position.x, dy = y - 120 - q.body.position.y, d = Math.hypot(dx, dy) || 1;
      Body.setVelocity(q.body, { x: q.body.velocity.x + (dx / d) * 9, y: -6 + (dy / d) * 4 });
      damagePlayer(q, 10 * m, p);
    }
    spawnRing(x, y, '#c8f7f7'); spawnParticles(x, y, '#c8f7f7', 24, 7); addShake(7); sfx.cast();
  },
});
regHybrid('rockslide', {
  name: 'Rockslide', color: '#8a7a5a', cooldown: 2800,
  cast(p) {
    const m = p.mega || 1;
    const t = nearestEnemy(p);
    const cx = t ? t.body.position.x : p.body.position.x + p.facing * 300;
    // the mountain actually comes down: a stagger of real boulders rains on the
    // target's column and detonates on impact (the old version air-burst at
    // sky height and visibly did nothing)
    const t0 = simNow();
    let dropped = 0;
    activeEffects.push({
      until: t0 + 1100,
      update(now) {
        while (dropped < 6 && now > t0 + dropped * 140) {
          dropped++;
          const rx = Math.max(60, Math.min(W - 60, cx + rand(-150, 150)));
          const rock = dropProjectile(p, rx, -40, { r: rand(11, 17) * Math.min(m, 1.6), vy: rand(14, 18), vx: rand(-1.5, 1.5), color: dropped % 2 ? '#8a7a5a' : '#5a5245', density: 0.008 });
          rock.onHit = () => explode(rock.position.x, rock.position.y, 100 * m, 15 * m, 20 * m, p, { selfSafe: true });
        }
      },
    });
    for (const q of enemiesOf(p)) if (Math.abs(q.body.position.x - cx) < 220) q.heavyUntil = simNow() + 1800 * m;
    addShake(11); sfx.thud?.();
  },
});
regHybrid('bigcrunch', {
  name: 'Big Crunch', color: '#a55eea', cooldown: 4000,
  cast(p) {
    const m = p.mega || 1;
    const dir = aimDir(p, 1, 0);
    const sx = p.body.position.x + dir.x * 240, sy = p.body.position.y + dir.y * 240;
    spawnSingularity(sx, sy, 1.6 * m, p, { selfSafe: true });
    activeEffects.push({ until: simNow() + 1000, onEnd() { explode(sx, sy, 320, 30 * m, 44 * m, p, { selfSafe: true }); addShake(16); doFlash('#a55eea', 0.4); } });
  },
});
regHybrid('sanctuary', {
  name: 'Sanctuary', color: '#7bd88f', cooldown: 6000,
  cast(p) {
    const m = p.mega || 1;
    healPlayer(p, 45 * m);
    p.invulnUntil = simNow() + 2200 * m;
    spawnRing(p.body.position.x, p.body.position.y, '#7bd88f');
    spawnParticles(p.body.position.x, p.body.position.y, '#7bd88f', 22, 5);
    spawnText(p.body.position.x, p.body.position.y - 50, 'SANCTUARY', '#7bd88f'); sfx.pickup?.();
  },
});

// ---- cross-school fusions ----
regHybrid('frozenstar', {
  name: 'Frozen Star', color: '#9be7ff', cooldown: 3400,
  cast(p) {
    const m = p.mega || 1;
    const dir = aimDir(p, 1, 0);
    const sx = p.body.position.x + dir.x * 240, sy = p.body.position.y - 30 + dir.y * 240;
    spawnSingularity(sx, sy, m, p, { selfSafe: true });
    for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - sx, q.body.position.y - sy) < 320) { q.frozenUntil = simNow() + 1100 * m; q.body.frictionAir = 0.001; }
    doFlash('#9be7ff', 0.3); sfx.freeze();
  },
});
regHybrid('frostward', {
  name: 'Frost Ward', color: '#aee4ff', cooldown: 3000,
  cast(p) {
    const m = p.mega || 1, now = simNow();
    // a true ward now: heal + a mirror of ice that flings incoming spells back
    // at the sender (the parry reflect, held longer), while anyone who presses
    // in close locks up solid. The reflect shimmer is netted (rf flag).
    healPlayer(p, 22 * m);
    p.reflectUntil = Math.max(p.reflectUntil || 0, now + 1900 * m);
    for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - p.body.position.x, q.body.position.y - p.body.position.y) < 260) { q.frozenUntil = now + 900 * m; q.body.frictionAir = 0.001; }
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; spawnBurst(p.body.position.x + Math.cos(a) * 34, p.body.position.y - 8 + Math.sin(a) * 34, '#eaffff', 2, { kind: 'spark', dir: a, spread: 0.2, speed: 1.5, g: 0, life: 50, r: 2 }); }
    spawnRing(p.body.position.x, p.body.position.y, '#aee4ff');
    spawnText(p.body.position.x, p.body.position.y - 50, 'FROST WARD', '#aee4ff');
    sfx.freeze();
  },
});
regHybrid('ionstorm', {
  name: 'Ion Storm', color: '#9ef0f0', cooldown: 3600,
  cast(p) {
    const m = p.mega || 1;
    const dir = aimDir(p, 1, 0);
    const sx = p.body.position.x + dir.x * 260, sy = p.body.position.y + dir.y * 200;
    spawnSingularity(sx, sy, m, p, { selfSafe: true });
    const t0 = simNow(); let i = 0;
    activeEffects.push({ until: t0 + 1100, update(now) { if (now > t0 + i * 200 && i < 5) { i++; skyBolt(sx + rand(-120, 120), 18, p, m, { selfSafe: true }); } } });
    doFlash('#9ef0f0', 0.25);
  },
});
regHybrid('defibrillator', {
  name: 'Defibrillator', color: '#e3f265', cooldown: 3000, beam: true,
  cast(p) {
    const m = p.mega || 1;
    healPlayer(p, 22 * m);
    for (const ao of [-0.12, 0.12]) zapRay(p, 34, 20, 4, ao);
    doFlash('#ffffff', 0.35); addShake(8); sfx.lightning();
  },
});
regHybrid('sandstorm', {
  name: 'Sandstorm', color: '#d8c48a', cooldown: 2800,
  cast(p) {
    const m = p.mega || 1;
    for (let i = 0; i < 6; i++) boomBolt(p, { selfSafe: true, color: '#d8c48a', r: 4, vy: rand(-6, 2), speed: rand(16, 26), radius: 55, power: 12, dmg: 10 });
    for (const q of enemiesOf(p)) if (Math.abs(q.body.position.x - p.body.position.x) < 500 && (q.body.position.x - p.body.position.x) * p.facing > 0) { q.reversedUntil = simNow() + 1400 * m; Body.setVelocity(q.body, { x: q.body.velocity.x + p.facing * 7, y: q.body.velocity.y - 2 }); }
    spawnParticles(p.body.position.x + p.facing * 120, p.body.position.y, '#d8c48a', 20, 6); sfx.cast();
  },
});
regHybrid('zephyr', {
  name: 'Zephyr', color: '#dfffff', cooldown: 4000,
  cast(p) {
    const m = p.mega || 1;
    healPlayer(p, 20 * m);
    p.speedUntil = simNow() + 3000; p.jumpBoostUntil = simNow() + 3000; p.featherUntil = simNow() + 2000; // gentle glide, not balloon lift
    for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - p.body.position.x, q.body.position.y - p.body.position.y) < 240) Body.setVelocity(q.body, { x: (q.body.position.x - p.body.position.x) * 0.05 + Math.sign(q.body.position.x - p.body.position.x) * 8, y: -7 });
    spawnText(p.body.position.x, p.body.position.y - 50, 'ZEPHYR', '#dfffff'); spawnParticles(p.body.position.x, p.body.position.y, '#dfffff', 16, 5); sfx.boing?.();
  },
});
regHybrid('gravitywell', {
  name: 'Gravity Well', color: '#7a6a9a', cooldown: 3400,
  cast(p) {
    const m = p.mega || 1;
    const t = nearestEnemy(p);
    const cx = t ? t.body.position.x : p.body.position.x + p.facing * 260;
    const cy = t ? t.body.position.y : p.body.position.y;
    for (const q of enemiesOf(p)) {
      const dx = cx - q.body.position.x, dy = cy - q.body.position.y, d = Math.hypot(dx, dy) || 1;
      if (d < 400) { Body.setVelocity(q.body, { x: q.body.velocity.x + (dx / d) * 10, y: q.body.velocity.y + (dy / d) * 6 }); q.heavyUntil = simNow() + 2000 * m; }
    }
    activeEffects.push({ until: simNow() + 500, onEnd() { explode(cx, cy, 200, 20 * m, 30 * m, p, { selfSafe: true }); addShake(12); } });
    spawnRing(cx, cy, '#7a6a9a');
  },
});
regHybrid('bulwark', {
  name: 'Bulwark', color: '#9a8a6a', cooldown: 4200,
  cast(p) {
    const m = p.mega || 1;
    healPlayer(p, 28 * m);
    p.invulnUntil = simNow() + 1400 * m;
    explode(p.body.position.x, p.body.position.y, 180, 22 * m, 16 * m, p, { selfSafe: true }); // stone shockwave shoves foes off
    spawnRing(p.body.position.x, p.body.position.y, '#9a8a6a'); spawnText(p.body.position.x, p.body.position.y - 50, 'BULWARK', '#9a8a6a'); addShake(8);
  },
});
regHybrid('soulharvest', {
  name: 'Soul Harvest', color: '#b39ddb', cooldown: 4000,
  cast(p) {
    const m = p.mega || 1;
    let reaped = 0;
    for (const q of enemiesOf(p)) {
      if (Math.hypot(q.body.position.x - p.body.position.x, q.body.position.y - p.body.position.y) < 420) {
        damagePlayer(q, 22 * m, p); reaped++;
        boltVisual(q.body.position.x, q.body.position.y, p.body.position.x, p.body.position.y, '#b39ddb', 2, 130);
        spawnBurst(q.body.position.x, q.body.position.y, '#b39ddb', 8, { speed: 4, up: 3, g: -0.05, life: 46 });
      }
    }
    if (reaped) healPlayer(p, 12 * reaped * m);
    spawnParticles(p.body.position.x, p.body.position.y, '#b39ddb', 20, 5); doFlash('#b39ddb', 0.2); sfx.blackhole?.();
  },
});

// ---- Trickster (chaos / prank) fusions ----
const CHAOS_COLORS = ['#ff6b81', '#4ecdff', '#ffd166', '#7bd88f', '#a55eea', '#ff9ff3'];
function chaosBurst(x, y, count = 14, o = {}) {
  for (const c of CHAOS_COLORS) spawnBurst(x, y, c, Math.ceil(count / CHAOS_COLORS.length), o);
}
regHybrid('pandemonium', {
  name: 'Pandemonium', color: '#ff9ff3', cooldown: 3600,
  cast(p) {
    const m = p.mega || 1, now = simNow();
    for (const q of enemiesOf(p)) {
      const roll = Math.floor(simRandom() * 5);
      if (roll === 0) q.frozenUntil = now + 1000 * m;
      else if (roll === 1) q.reversedUntil = now + 2500 * m;
      else if (roll === 2) q.shrinkUntil = now + 3500 * m;
      else if (roll === 3) { q.floatyUntil = now + 2500 * m; Body.setVelocity(q.body, { x: q.body.velocity.x, y: -9 }); }
      else q.heavyUntil = now + 2500 * m;
      chaosBurst(q.body.position.x, q.body.position.y, 12, { speed: 5, up: 2 });
    }
    chaosBurst(p.body.position.x, p.body.position.y, 30, { speed: 8, up: 3 });
    setBanner('PANDEMONIUM!', '#ff9ff3', 900, true); addShake(8); sfx.hyper?.();
  },
});
regHybrid('hexfire', {
  name: 'Hexfire', color: '#ff7ac0', cooldown: 2600,
  cast(p) {
    const m = p.mega || 1, now = simNow();
    for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - p.body.position.x, q.body.position.y - p.body.position.y) < 460) {
      q.burnUntil = now + 2600 * m; q.shrinkUntil = now + 3000 * m; damagePlayer(q, 12 * m, p);
      spawnBurst(q.body.position.x, q.body.position.y, '#ff7ac0', 10, { speed: 5, up: 3, g: 0.1 });
    }
    doFlash('#ff7ac0', 0.2); sfx.cast();
  },
});
regHybrid('coldfeet', {
  name: 'Cold Feet', color: '#a7d8ff', cooldown: 2800,
  cast(p) {
    const m = p.mega || 1, now = simNow();
    for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - p.body.position.x, q.body.position.y - p.body.position.y) < 420) {
      q.frozenUntil = now + 700 * m; q.reversedUntil = now + 3000 * m; q.body.frictionAir = 0.001;
      spawnBurst(q.body.position.x, q.body.position.y, '#a7d8ff', 12, { speed: 5, r: 2.5 });
    }
    sfx.freeze();
  },
});
regHybrid('joybuzzer', {
  name: 'Joy Buzzer', color: '#f2e14e', cooldown: 2400, beam: true,
  cast(p) {
    const m = p.mega || 1;
    const { hit } = zapRay(p, 30, 22, 4);
    if (hit && hit.label === 'player') { hit.player.reversedUntil = simNow() + 2600 * m; spawnBurst(hit.position.x, hit.position.y, '#f2e14e', 16, { kind: 'spark', speed: 8 }); }
    doFlash('#ffffff', 0.3); addShake(7); sfx.lightning();
  },
});
regHybrid('whirligig', {
  name: 'Whirligig', color: '#c9f7ff', cooldown: 2800,
  cast(p) {
    const m = p.mega || 1, now = simNow(), { x, y } = p.body.position;
    for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - x, q.body.position.y - y) < 380) {
      q.floatyUntil = now + 2600 * m; q.reversedUntil = now + 1600 * m;
      const ang = Math.atan2(q.body.position.y - y, q.body.position.x - x) + Math.PI / 2;
      Body.setVelocity(q.body, { x: Math.cos(ang) * 10, y: -8 });
    }
    for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; spawnBurst(x + Math.cos(a) * 40, y + Math.sin(a) * 40, '#c9f7ff', 2, { dir: a + Math.PI / 2, spread: 0.4, speed: 6, up: 0 }); }
    sfx.boing?.();
  },
});
regHybrid('boobytrap', {
  name: 'Booby Trap', color: '#d8b26a', cooldown: 3000,
  cast(p) {
    const m = p.mega || 1;
    const t = nearestEnemy(p);
    const cx = t ? t.body.position.x : p.body.position.x + p.facing * 260;
    // an actual trap now (it's in the name): a visible armed charge with a fuse
    // appears at the target's feet — move, or eat it. No more instant any-range nuke.
    const gy = groundYAt(cx);
    spawnText(cx, gy - 40, 'TICK...', '#d8b26a');
    spawnParticles(cx, gy - 12, '#d8b26a', 6, 2, 30);
    const t0 = simNow();
    activeEffects.push({
      until: t0 + 900,
      draw(now, ctx) {
        ctx.fillStyle = Math.sin(now * 0.025) > 0 ? '#d8b26a' : '#ff5e57';
        ctx.beginPath(); ctx.arc(cx, gy - 10, 7, 0, Math.PI * 2); ctx.fill();
      },
      onEnd() {
        explode(cx, gy - 10, 170, 22 * m, 28 * m, p, { selfSafe: true });
        const nw = simNow();
        for (const q of enemiesOf(p)) if (Math.abs(q.body.position.x - cx) < 200 && Math.abs(q.body.position.y - gy) < 160) q.heavyUntil = nw + 2500 * m;
        chaosBurst(cx, gy - 20, 12, { speed: 6, up: 3 });
        addShake(10); sfx.thud?.();
      },
    });
  },
});
regHybrid('realityglitch', {
  name: 'Reality Glitch', color: '#b06bff', cooldown: 3800,
  cast(p) {
    const m = p.mega || 1;
    const dir = aimDir(p, 1, 0);
    const sx = p.body.position.x + dir.x * 240, sy = p.body.position.y + dir.y * 240;
    spawnSingularity(sx, sy, m, p, { selfSafe: true });
    for (const q of enemiesOf(p)) {
      Body.setPosition(q.body, { x: rand(120, W - 120), y: rand(120, 360) }); // blink them somewhere random
      chaosBurst(q.body.position.x, q.body.position.y, 12, { speed: 6 });
    }
    doFlash('#b06bff', 0.35); slowMo(0.4, 260); sfx.freeze();
  },
});
regHybrid('voodoo', {
  name: 'Voodoo', color: '#c65ba0', cooldown: 3600,
  cast(p) {
    const m = p.mega || 1, now = simNow();
    let drained = 0;
    for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - p.body.position.x, q.body.position.y - p.body.position.y) < 440) {
      damagePlayer(q, 16 * m, p); q.shrinkUntil = now + 3500 * m; drained++;
      boltVisual(q.body.position.x, q.body.position.y, p.body.position.x, p.body.position.y, '#c65ba0', 2, 120);
    }
    if (drained) healPlayer(p, 10 * drained * m);
    spawnBurst(p.body.position.x, p.body.position.y, '#c65ba0', 20, { speed: 5, up: 2 }); doFlash('#c65ba0', 0.2); sfx.blackhole?.();
  },
});
