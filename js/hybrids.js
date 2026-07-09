// hybrids.js — FUSION: two slotted spells combine into a bespoke, 1-of-a-kind
// hybrid. Each hybrid is hand-authored (name, colour, cooldown, cast). Recipes
// match on small hand-picked ingredient FAMILIES (so fusions are actually
// reachable), order-independent. A Fusion Catalyst pickup acts as a WILD
// ingredient that fuses with whatever you're holding. Hybrids are flagged so the
// tome pool never drops them — they only exist through fusion.
const WILD = '__wild__';

function regHybrid(id, def) { def.hybrid = true; SPELLS[id] = def; }

// ingredient families (a spell may sit in more than one; first matching recipe wins)
const F_FIRE  = ['fireball', 'ember', 'twinfire', 'trishot', 'scatter', 'mortar', 'sunburst', 'skullrocket', 'dragonbreath', 'ignite', 'shard', 'firecrackers', 'volcanospell', 'napalm', 'flamewall', 'phoenixdash', 'starfall'];
const F_ICE   = ['frost', 'iceshard', 'snowball', 'coldsnap', 'glacier', 'permafrost', 'blizzard', 'frostnova', 'icicledrop', 'flashfreeze'];
const F_ZAP   = ['lightning', 'zapspell', 'thunderlance', 'chain', 'railgun', 'sweep', 'skysmite', 'teslacoil', 'lightningrod', 'stormcall'];
const F_AIR   = ['gust', 'shove', 'cyclone', 'vortexpull', 'updraft', 'tornado', 'repulsor', 'slam', 'magnetpalm'];
const F_EARTH = ['cratedrop', 'anvil', 'piano', 'boulder', 'stonewall', 'bowling', 'sawblade', 'cannonball'];
const F_VOID  = ['blackhole', 'meteor', 'bigbang', 'gravflip', 'chaostheory', 'moongrav'];
const F_LIFE  = ['secondwind', 'vampirebolt', 'aegis', 'ghostwalk'];

// recipes: unordered {a, b} family pair -> hybrid id. The 7 same-family entries
// are the "amplified" pure fusions (listed first, so a WILD catalyst on any spell
// resolves to its school's amp). Then all 21 cross-school pairs. Full 7x7 matrix.
const FUSIONS = [
  // --- amplified (same-school) ---
  { id: 'inferno',        a: F_FIRE,  b: F_FIRE },
  { id: 'absolutezero',   a: F_ICE,   b: F_ICE },
  { id: 'overload',       a: F_ZAP,   b: F_ZAP },
  { id: 'maelstrom',      a: F_AIR,   b: F_AIR },
  { id: 'rockslide',      a: F_EARTH, b: F_EARTH },
  { id: 'bigcrunch',      a: F_VOID,  b: F_VOID },
  { id: 'sanctuary',      a: F_LIFE,  b: F_LIFE },
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
];

// resolve the hybrid id for two slotted spell ids (either order), WILD matches any
function hybridFor(x, y) {
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
function tryFuse(p) {
  if (!p.slots[0] || !p.slots[1]) return false;
  const id = hybridFor(p.slots[0], p.slots[1]);
  if (!id) return false;
  const def = SPELLS[id];
  p.slots[0] = id; p.slots[1] = null;
  p.casts[0] = 0; p.slotFilledAt[0] = performance.now();
  p.lastCastSlot = 0;
  const { x, y } = p.body.position;
  setBanner('⚡ FUSION! ' + def.name.toUpperCase(), def.color, 1500, true);
  spawnText(x, y - 62, def.name.toUpperCase() + '!', def.color);
  spawnRing(x, y, def.color);
  spawnParticles(x, y, def.color, 28, 8);
  doFlash(def.color, 0.3);
  addShake(9);
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
      fb.onHit = () => explode(fb.position.x, fb.position.y, 90 * m, 14 * m, 22 * m, p);
    }
    explode(p.body.position.x, p.body.position.y, 130 * m, 12 * m, 8 * m, p);
    for (const q of enemiesOf(p)) q.burnUntil = performance.now() + 2500 * m;
    doFlash('#ff5e3a', 0.3); addShake(7); sfx.cast();
  },
});
regHybrid('absolutezero', {
  name: 'Absolute Zero', color: '#bfe8ff', cooldown: 3000,
  cast(p) {
    const m = p.mega || 1;
    sfx.freeze(); doFlash('#bfe8ff', 0.35); addShake(6);
    for (const q of enemiesOf(p)) {
      q.frozenUntil = performance.now() + 1400 * m;
      q.body.frictionAir = 0.001;
      damagePlayer(q, 14 * m, p);
      spawnParticles(q.body.position.x, q.body.position.y, '#bfe8ff', 12, 4);
    }
  },
});
regHybrid('overload', {
  name: 'Overload', color: '#fffacd', cooldown: 2400,
  cast(p) {
    for (const ao of [-0.28, -0.14, 0, 0.14, 0.28]) zapRay(p, 26, 14, 3, ao);
    sfx.lightning(); doFlash('#ffffff', 0.4); addShake(9);
  },
});
regHybrid('steamburst', {
  name: 'Steam Burst', color: '#d7f0ea', cooldown: 1800,
  cast(p) {
    const m = p.mega || 1;
    boomBolt(p, { color: '#d7f0ea', r: 12, vy: -5, speed: 15, radius: 180, power: 22, dmg: 36 });
    const t = nearestEnemy(p, 520);
    if (t) { t.frozenUntil = performance.now() + 700 * m; t.body.frictionAir = 0.001; }
    sfx.freeze(); doFlash('#d7f0ea', 0.15);
  },
});
regHybrid('plasmalance', {
  name: 'Plasma Lance', color: '#ff4df0', cooldown: 2000,
  cast(p) {
    const m = p.mega || 1;
    zapRay(p, 52, 26, 4);
    sfx.lightning(); doFlash('#ff4df0', 0.3); addShake(8);
    const t = nearestEnemy(p, 1100);
    if (t) t.burnUntil = performance.now() + 2600 * m;
  },
});
regHybrid('superconductor', {
  name: 'Superconductor', color: '#9ef0f0', cooldown: 2000,
  cast(p) {
    const m = p.mega || 1;
    zapRay(p, 38, 10, 3);
    const t = nearestEnemy(p, 1100);
    if (t) {
      t.frozenUntil = performance.now() + 1000 * m; t.body.frictionAir = 0.001;
      boltVisual(p.body.position.x, p.body.position.y - 8, t.body.position.x, t.body.position.y, '#9ef0f0', 3, 120);
    }
    sfx.freeze();
  },
});
regHybrid('firestorm', {
  name: 'Firestorm', color: '#ff7043', cooldown: 2200,
  cast(p) {
    const m = p.mega || 1;
    for (let i = 0; i < 3; i++) boomBolt(p, { color: '#ff7043', r: 6, vy: rand(-10, -2), speed: rand(13, 20), radius: 100, power: 16, dmg: 18 });
    const t = nearestEnemy(p, 520);
    if (t) { t.burnUntil = performance.now() + 2000 * m; Body.setVelocity(t.body, { x: t.body.velocity.x, y: -9 }); }
    sfx.cast();
  },
});
regHybrid('howlingblizzard', {
  name: 'Howling Blizzard', color: '#d8f4ff', cooldown: 2600,
  cast(p) {
    const m = p.mega || 1;
    const { x, y } = p.body.position;
    explode(x + p.facing * 260, y, 220, 10 * m, 18 * m, p);
    for (const q of enemiesOf(p)) {
      if (Math.hypot(q.body.position.x - x, q.body.position.y - y) < 440) {
        q.frozenUntil = performance.now() + 800 * m; q.body.frictionAir = 0.001;
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
    const t0 = performance.now(); let i = 0;
    activeEffects.push({ until: t0 + 950, update(now) { if (now > t0 + i * 180 && i < 4) { i++; skyBolt(rand(80, W - 80), 22, p, m); } } });
    const t = nearestEnemy(p, 640);
    if (t) Body.setVelocity(t.body, { x: t.body.velocity.x, y: -11 });
    sfx.lightning();
  },
});
regHybrid('moltenmeteor', {
  name: 'Molten Meteor', color: '#ff5e57', cooldown: 2600,
  cast(p) {
    const m = p.mega || 1;
    boomBolt(p, { color: '#ff5e57', r: 14, vy: -12, speed: 12, g: 0.9, radius: 200, power: 30, dmg: 48 });
    const t = nearestEnemy(p, 700);
    if (t) t.burnUntil = performance.now() + 2200 * m;
    addShake(6);
  },
});
regHybrid('avalanche', {
  name: 'Avalanche', color: '#8aa0b0', cooldown: 2800,
  cast(p) {
    const m = p.mega || 1;
    const t = nearestEnemy(p);
    const tx = t ? t.body.position.x : p.body.position.x + p.facing * 300;
    for (let i = 0; i < 3; i++) explode(tx + rand(-80, 80), 130, 120, 14 * m, 22 * m, p);
    for (const q of enemiesOf(p)) {
      if (Math.abs(q.body.position.x - tx) < 180) {
        q.frozenUntil = performance.now() + 700 * m; q.heavyUntil = performance.now() + 1500 * m;
      }
    }
    addShake(9); sfx.thud?.();
  },
});
regHybrid('teslashrapnel', {
  name: 'Tesla Shrapnel', color: '#c0c0cc', cooldown: 2200,
  cast(p) {
    zapRay(p, 44, 30, 4); addShake(9);
    Body.setVelocity(p.body, { x: p.body.velocity.x - p.facing * 8, y: p.body.velocity.y - 4 });
    for (let i = 0; i < 3; i++) boomBolt(p, { color: '#c0c0cc', r: 4, vy: rand(-6, 0), speed: rand(18, 26), radius: 60, power: 12, dmg: 12 });
    sfx.lightning();
  },
});
regHybrid('blacksun', {
  name: 'Black Sun', color: '#a55eea', cooldown: 3400,
  cast(p) {
    const m = p.mega || 1;
    const dir = aimDir(p, 1, 0);
    const sx = p.body.position.x + dir.x * 240, sy = p.body.position.y - 40 + dir.y * 240;
    spawnSingularity(sx, sy, m);
    explode(sx, sy, 160, 8 * m, 20 * m, p);
    for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - sx, q.body.position.y - sy) < 300) q.burnUntil = performance.now() + 2600 * m;
    doFlash('#a55eea', 0.3);
  },
});
regHybrid('eventhorizon', {
  name: 'Event Horizon', color: '#b58aff', cooldown: 3600,
  cast(p) {
    const m = p.mega || 1;
    const dir = aimDir(p, 1, 0);
    const sx = p.body.position.x + dir.x * 260, sy = p.body.position.y + dir.y * 260;
    spawnSingularity(sx, sy, m);
    activeEffects.push({ until: performance.now() + 720, onEnd() { explode(sx, sy, 260, 26 * m, 34 * m, p); addShake(12); } });
  },
});
regHybrid('soulflame', {
  name: 'Soul Flame', color: '#c2185b', cooldown: 2000,
  cast(p) {
    const m = p.mega || 1;
    const fb = shoot(p, { r: 7, speed: 18, vy: -4, color: '#c2185b', gravityScale: 0.5 });
    fb.owner = p;
    fb.onHit = (self, other) => {
      explode(self.position.x, self.position.y, 90 * m, 10 * m, 26 * m, p);
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
    for (let i = 0; i < 5; i++) explode(cx + rand(-140, 140), rand(100, 180), 110, 16 * m, 20 * m, p);
    for (const q of enemiesOf(p)) if (Math.abs(q.body.position.x - cx) < 220) q.heavyUntil = performance.now() + 1800 * m;
    addShake(11); sfx.thud?.();
  },
});
regHybrid('bigcrunch', {
  name: 'Big Crunch', color: '#a55eea', cooldown: 4000,
  cast(p) {
    const m = p.mega || 1;
    const dir = aimDir(p, 1, 0);
    const sx = p.body.position.x + dir.x * 240, sy = p.body.position.y + dir.y * 240;
    spawnSingularity(sx, sy, 1.6 * m);
    activeEffects.push({ until: performance.now() + 1000, onEnd() { explode(sx, sy, 320, 30 * m, 44 * m, p); addShake(16); doFlash('#a55eea', 0.4); } });
  },
});
regHybrid('sanctuary', {
  name: 'Sanctuary', color: '#7bd88f', cooldown: 6000,
  cast(p) {
    const m = p.mega || 1;
    healPlayer(p, 45 * m);
    p.invulnUntil = performance.now() + 2200 * m;
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
    spawnSingularity(sx, sy, m);
    for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - sx, q.body.position.y - sy) < 320) { q.frozenUntil = performance.now() + 1100 * m; q.body.frictionAir = 0.001; }
    doFlash('#9be7ff', 0.3); sfx.freeze();
  },
});
regHybrid('frostward', {
  name: 'Frost Ward', color: '#aee4ff', cooldown: 3000,
  cast(p) {
    const m = p.mega || 1;
    healPlayer(p, 24 * m);
    for (const q of enemiesOf(p)) if (Math.hypot(q.body.position.x - p.body.position.x, q.body.position.y - p.body.position.y) < 260) { q.frozenUntil = performance.now() + 900 * m; q.body.frictionAir = 0.001; }
    spawnRing(p.body.position.x, p.body.position.y, '#aee4ff'); sfx.freeze();
  },
});
regHybrid('ionstorm', {
  name: 'Ion Storm', color: '#9ef0f0', cooldown: 3600,
  cast(p) {
    const m = p.mega || 1;
    const dir = aimDir(p, 1, 0);
    const sx = p.body.position.x + dir.x * 260, sy = p.body.position.y + dir.y * 200;
    spawnSingularity(sx, sy, m);
    const t0 = performance.now(); let i = 0;
    activeEffects.push({ until: t0 + 1100, update(now) { if (now > t0 + i * 200 && i < 5) { i++; skyBolt(sx + rand(-120, 120), 18, p, m); } } });
    doFlash('#9ef0f0', 0.25);
  },
});
regHybrid('defibrillator', {
  name: 'Defibrillator', color: '#e3f265', cooldown: 3000,
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
    for (let i = 0; i < 6; i++) boomBolt(p, { color: '#d8c48a', r: 4, vy: rand(-6, 2), speed: rand(16, 26), radius: 55, power: 12, dmg: 10 });
    for (const q of enemiesOf(p)) if (Math.abs(q.body.position.x - p.body.position.x) < 500 && (q.body.position.x - p.body.position.x) * p.facing > 0) { q.reversedUntil = performance.now() + 1400 * m; Body.setVelocity(q.body, { x: q.body.velocity.x + p.facing * 7, y: q.body.velocity.y - 2 }); }
    spawnParticles(p.body.position.x + p.facing * 120, p.body.position.y, '#d8c48a', 20, 6); sfx.cast();
  },
});
regHybrid('zephyr', {
  name: 'Zephyr', color: '#dfffff', cooldown: 4000,
  cast(p) {
    const m = p.mega || 1;
    healPlayer(p, 20 * m);
    p.speedUntil = performance.now() + 3000; p.jumpBoostUntil = performance.now() + 3000; p.floatyUntil = performance.now() + 2000;
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
      if (d < 400) { Body.setVelocity(q.body, { x: q.body.velocity.x + (dx / d) * 10, y: q.body.velocity.y + (dy / d) * 6 }); q.heavyUntil = performance.now() + 2000 * m; }
    }
    activeEffects.push({ until: performance.now() + 500, onEnd() { explode(cx, cy, 200, 20 * m, 30 * m, p); addShake(12); } });
    spawnRing(cx, cy, '#7a6a9a');
  },
});
regHybrid('bulwark', {
  name: 'Bulwark', color: '#9a8a6a', cooldown: 4200,
  cast(p) {
    const m = p.mega || 1;
    healPlayer(p, 28 * m);
    p.invulnUntil = performance.now() + 1400 * m;
    explode(p.body.position.x, p.body.position.y, 180, 22 * m, 16 * m, p); // stone shockwave shoves foes off
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
      }
    }
    if (reaped) healPlayer(p, 12 * reaped * m);
    spawnParticles(p.body.position.x, p.body.position.y, '#b39ddb', 20, 5); doFlash('#b39ddb', 0.2); sfx.blackhole?.();
  },
});
