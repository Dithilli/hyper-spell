// pickups.js — spell tomes and the rare Mega Hat raining from the sky.
// Their art lives in src/render/draw-pickups.js.
import { W, H, onWorldReset } from './world.js';
import { addBody, allBodies, createBox, gravityY, removeBody, scaleBody } from './phys/facade.js';
import { simRandom, rand, pick } from './rng.js';
import { spawnParticles, spawnRing, spawnText, addShake, doFlash } from './fx.js';
import { sfx } from './sfx.js';
import { statFor } from './awards.js';
import { telPick } from './telemetry.js';
import { game, setBanner, currentMap } from './match.js';
import { players, MAX_HP, addSpell } from './player/lifecycle.js';
import { SPELLS } from './spells/registry.js';
import { TIER_COLOR, TIER_RANK, spellTier, weightedSpellPick } from './spells/tiers.js';
import { WILD, tryFuse } from './spells/fusion.js';

export const tomes = new Set();
export const hats = new Set();
let nextTomeAt = 0, lastTomeSpell = null, firstDrop = false;
function tomePool() {
  return Object.keys(SPELLS).filter(id => !SPELLS[id].hybrid); // hybrids come only from fusion
}

export function scheduleTomes(now) {
  nextTomeAt = now + rand(1200, 2500);
  firstDrop = true;
}

export function updateTomes(now) {
  const tomeCap = Math.max(3, Math.ceil(players.length / 2));
  if (now > nextTomeAt && (firstDrop || tomes.size < tomeCap)) {
    if (firstDrop) {
      // opening volley: one tome per wizard, everyone gets armed
      firstDrop = false;
      const n = Math.max(2, players.length);
      for (let i = 0; i < n; i++) spawnTome(now);
    } else {
      const roll = simRandom();
      const megaOut = hats.size > 0 || players.some(p => p.megaCasts > 0);
      if (!megaOut && roll < 0.12) spawnHat(now);
      else if (roll < 0.22) spawnCatalyst(now); // ~10% rare Fusion Catalyst
      else spawnTome(now);
    }
    nextTomeAt = now + rand(3500, 5500);
  }
  for (const t of [...tomes, ...hats]) {
    if (now - t.bornAt > 20000 || t.position.y > H + 80 || t.position.y < -120) {
      spawnParticles(t.position.x, t.position.y, '#e8d5ff', 6, 3);
      tomes.delete(t);
      hats.delete(t);
      removeBody(t);
    }
  }
}

// find a drop point that actually lands somewhere wizards can reach,
// respecting ceilings and flipped gravity
export function tomeDropSpot() {
  const g = gravityY();
  const solids = allBodies().filter(b =>
    (b.isStatic || b.label === 'plank') && !b.isSensor && b.collisionFilter.mask !== 0 &&
    b.bounds.min.x > -60 && b.bounds.max.x < W + 60);
  for (let tries = 0; tries < 24; tries++) {
    const x = rand(90, W - 90);
    const col = solids.filter(b => x > b.bounds.min.x + 6 && x < b.bounds.max.x - 6);
    if (!col.length) continue;
    if (g >= 0) {
      const tops = col.map(b => b.bounds.min.y).filter(y => y > 130 && y < H - 50);
      if (!tops.length) continue;
      const top = Math.min(...tops);
      const blocked = col.some(b => b.bounds.max.y < top - 4 && b.bounds.max.y > 0);
      return { x, y: blocked ? top - 34 : -40 };
    } else {
      const bottoms = col.map(b => b.bounds.max.y).filter(y => y > 100 && y < H - 80);
      if (!bottoms.length) continue;
      const bottom = Math.max(...bottoms);
      const blocked = col.some(b => b.bounds.min.y > bottom + 4 && b.bounds.min.y < H);
      return { x, y: blocked ? bottom + 34 : H + 40 };
    }
  }
  const s = pick(currentMap.def.spawns);
  return { x: s.x, y: Math.max(60, s.y - 40) };
}

export function spawnTome(now) {
  const pool = tomePool();
  let spell;
  // weighted by rarity tier (js/spelltiers.js): strong spells drop rarely.
  // don't repeat the last tome back-to-back so consecutive drops feel varied.
  do { spell = weightedSpellPick(pool); } while (spell === lastTomeSpell && pool.length > 1);
  lastTomeSpell = spell;
  const spot = tomeDropSpot();
  const tome = createBox(spot.x, spot.y, 20, 24, { density: 0.001, frictionAir: 0.05, label: 'tome' });
  tome.spell = spell;
  tome.bornAt = now;
  tomes.add(tome);
  addBody(tome);
}

export function spawnCatalyst(now) {
  const spot = tomeDropSpot();
  const c = createBox(spot.x, spot.y, 22, 22, { density: 0.001, frictionAir: 0.05, label: 'tome' });
  c.catalyst = true; // picked up through the normal tome path, fuses instead of arming
  c.bornAt = now;
  tomes.add(c);
  addBody(c);
}

export function spawnHat(now) {
  const spot = tomeDropSpot();
  const hat = createBox(spot.x, spot.y, 28, 20, { density: 0.001, frictionAir: 0.05, label: 'hat' });
  hat.bornAt = now;
  hats.add(hat);
  addBody(hat);
  setBanner('A MEGA HAT FALLS...', '#ffd700', 1200);
}

export function pickupTome(tome, p) {
  if (!tomes.has(tome) || !p.alive) return;
  tomes.delete(tome);
  removeBody(tome);
  if (tome.catalyst) { grabCatalyst(p); return; }
  if (game.state === 'PLAY') { statFor(p).tomes++; telPick(tome.spell); } // balance: spell pick count
  const slot = addSpell(p, tome.spell); // fills an empty slot, else replaces the oldest (never a charged fusion)
  if (slot === -1) return; // both hands hold charged fusions — the tome fizzles ('HANDS FULL!')
  sfx.pickup();
  spawnParticles(tome.position.x, tome.position.y, SPELLS[tome.spell].color, 14, 5);
  spawnText(p.body.position.x, p.body.position.y - 48, SPELLS[tome.spell].name.toUpperCase() + '!', SPELLS[tome.spell].color);
  // rare & legendary grabs get a shout so a jackpot lands with weight
  const tier = spellTier(tome.spell);
  if ((TIER_RANK[tier] || 0) >= 2) {
    spawnText(p.body.position.x, p.body.position.y - 66, tier === 'legendary' ? '★ LEGENDARY ★' : 'RARE!', TIER_COLOR[tier]);
    spawnParticles(tome.position.x, tome.position.y, TIER_COLOR[tier], tier === 'legendary' ? 22 : 12, 6);
    if (tier === 'legendary') { setBanner('★ LEGENDARY SPELL ★', TIER_COLOR[tier], 900); sfx.hyper?.(); }
  }
  tryFuse(p); // two slots now full & matching a recipe → auto-fuse into the hybrid
}

// the Fusion Catalyst acts as a WILD ingredient: it fuses with what you already
// hold. If your two slots already match, it fuses those; otherwise it turns into a
// wildcard that fuses with your held spell (sacrificing the other). No match → fizzle.
export function grabCatalyst(p) {
  sfx.pickup();
  const { x, y } = p.body.position;
  spawnParticles(x, y, '#ff4df0', 18, 6);
  if (tryFuse(p)) return; // slots already form a recipe
  // wildcard: pair WILD with the kept spell (the newest, if two are held)
  const held = p.slots[0] || p.slots[1];
  if (held) {
    const keepSlot = p.slotFilledAt[0] >= p.slotFilledAt[1] ? 0 : 1; // keep the newer
    const kept = p.slots[keepSlot] || held;
    p.slots[0] = WILD; p.slots[1] = kept;
    if (tryFuse(p)) return;
    p.slots[0] = kept; p.slots[1] = null; // no recipe for it → restore, drop the wild
  }
  spawnText(x, y - 52, 'NO FUSION', '#ff4df0');
}

export function pickupHat(hat, p) {
  if (!hats.has(hat) || !p.alive) return;
  hats.delete(hat);
  removeBody(hat);
  p.megaCasts = 3;
  p.hp = MAX_HP; // the mega hat restores you to full
  if ((p.sizeScale || 1) === 1) {
    scaleBody(p.body, 2, 2);
    p.sizeScale = 2;
  }
  sfx.victory();
  doFlash('#ffd700', 0.2);
  addShake(8);
  spawnRing(p.body.position.x, p.body.position.y, '#ffd700');
  spawnParticles(p.body.position.x, p.body.position.y, '#ffd700', 24, 7);
  spawnText(p.body.position.x, p.body.position.y - 70, 'MEGA WIZARD!', '#ffd700');
  setBanner(`${p.name} IS MEGA`, '#ffd700', 1400);
}

export function unMega(p) {
  if ((p.sizeScale || 1) > 1) {
    scaleBody(p.body, 0.5, 0.5);
    p.sizeScale = 1;
    spawnParticles(p.body.position.x, p.body.position.y, '#ffd700', 12, 4);
  }
}

onWorldReset(() => {
  tomes.clear();
  hats.clear();
  nextTomeAt = 0;
  lastTomeSpell = null;
  firstDrop = false;
});
