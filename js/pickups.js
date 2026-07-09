// pickups.js — spell tomes and the rare Mega Hat raining from the sky
const tomes = new Set();
const hats = new Set();
let nextTomeAt = 0, lastTomeSpell = null, firstDrop = false;
function tomePool() {
  return Object.keys(SPELLS).filter(id => !SPELLS[id].hybrid); // hybrids come only from fusion
}

function scheduleTomes(now) {
  nextTomeAt = now + rand(1200, 2500);
  firstDrop = true;
}

function updateTomes(now) {
  const tomeCap = Math.max(3, Math.ceil(players.length / 2));
  if (now > nextTomeAt && (firstDrop || tomes.size < tomeCap)) {
    if (firstDrop) {
      // opening volley: one tome per wizard, everyone gets armed
      firstDrop = false;
      const n = Math.max(2, players.length);
      for (let i = 0; i < n; i++) spawnTome(now);
    } else {
      const roll = Math.random();
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
      Composite.remove(world, t);
    }
  }
}

// find a drop point that actually lands somewhere wizards can reach,
// respecting ceilings and flipped gravity
function tomeDropSpot() {
  const g = engine.gravity.y;
  const solids = Composite.allBodies(world).filter(b =>
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

function spawnTome(now) {
  const pool = tomePool();
  let spell;
  // weighted by rarity tier (js/spelltiers.js): strong spells drop rarely.
  // don't repeat the last tome back-to-back so consecutive drops feel varied.
  do { spell = weightedSpellPick(pool); } while (spell === lastTomeSpell && pool.length > 1);
  lastTomeSpell = spell;
  const spot = tomeDropSpot();
  const tome = Bodies.rectangle(spot.x, spot.y, 20, 24, { density: 0.001, frictionAir: 0.05, label: 'tome' });
  tome.spell = spell;
  tome.bornAt = now;
  tomes.add(tome);
  Composite.add(world, tome);
}

function spawnCatalyst(now) {
  const spot = tomeDropSpot();
  const c = Bodies.rectangle(spot.x, spot.y, 22, 22, { density: 0.001, frictionAir: 0.05, label: 'tome' });
  c.catalyst = true; // picked up through the normal tome path, fuses instead of arming
  c.bornAt = now;
  tomes.add(c);
  Composite.add(world, c);
}

function spawnHat(now) {
  const spot = tomeDropSpot();
  const hat = Bodies.rectangle(spot.x, spot.y, 28, 20, { density: 0.001, frictionAir: 0.05, label: 'hat' });
  hat.bornAt = now;
  hats.add(hat);
  Composite.add(world, hat);
  setBanner('A MEGA HAT FALLS...', '#ffd700', 1200);
}

function pickupTome(tome, p) {
  if (!tomes.has(tome) || !p.alive) return;
  tomes.delete(tome);
  Composite.remove(world, tome);
  if (tome.catalyst) { grabCatalyst(p); return; }
  if (game.state === 'PLAY') { statFor(p).tomes++; telPick(tome.spell); } // balance: spell pick count
  addSpell(p, tome.spell); // fills an empty slot, else replaces the oldest
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
function grabCatalyst(p) {
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

function pickupHat(hat, p) {
  if (!hats.has(hat) || !p.alive) return;
  hats.delete(hat);
  Composite.remove(world, hat);
  p.megaCasts = 3;
  if ((p.sizeScale || 1) === 1) {
    Body.scale(p.body, 2, 2);
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

function unMega(p) {
  if ((p.sizeScale || 1) > 1) {
    Body.scale(p.body, 0.5, 0.5);
    p.sizeScale = 1;
    spawnParticles(p.body.position.x, p.body.position.y, '#ffd700', 12, 4);
  }
}

function drawTomeAt(x, y, angle, spellColor, now, tier) {
  // rare & legendary tomes get a pulsing rarity halo so a jackpot reads across the arena
  const rank = TIER_RANK[tier] || 0;
  if (rank >= 2) {
    const rc = TIER_COLOR[tier];
    const pulse = 0.5 + 0.5 * Math.sin(now * (rank >= 3 ? 0.012 : 0.008));
    ctx.save();
    ctx.globalAlpha = 0.18 + 0.22 * pulse;
    ctx.fillStyle = rc;
    ctx.beginPath(); ctx.arc(x, y, 20 + 8 * pulse + rank * 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.shadowColor = spellColor;
  ctx.shadowBlur = 12 + 6 * Math.sin(now * 0.008);
  ctx.fillStyle = '#3a2f4d';
  ctx.fillRect(-10, -12, 20, 24);
  ctx.fillStyle = spellColor;
  ctx.fillRect(-10, -12, 4, 24);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = spellColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-10, -12, 20, 24);
  ctx.restore();
}

// the Fusion Catalyst: a spinning magenta prism with a bright rarity halo
function drawCatalystAt(x, y, angle, now) {
  const pulse = 0.5 + 0.5 * Math.sin(now * 0.01);
  ctx.save();
  ctx.globalAlpha = 0.2 + 0.25 * pulse;
  ctx.fillStyle = '#ff4df0';
  ctx.beginPath(); ctx.arc(x, y, 20 + 9 * pulse, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(now * 0.004);
  ctx.shadowColor = '#ff4df0';
  ctx.shadowBlur = 16 + 6 * pulse;
  ctx.fillStyle = '#ff4df0';
  ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(10, 0); ctx.lineTo(0, 12); ctx.lineTo(-10, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffd6fb';
  ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(5, 0); ctx.lineTo(0, 6); ctx.lineTo(-5, 0); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawHatAt(x, y, angle, now) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 16 + 8 * Math.sin(now * 0.01);
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.moveTo(-11, 6); ctx.lineTo(11, 6); ctx.lineTo(3, -14);
  ctx.closePath(); ctx.fill();
  ctx.fillRect(-14, 6, 28, 4);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff3b0';
  ctx.beginPath(); ctx.arc(1, -2, 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawTomes(now) {
  for (const t of tomes) {
    if (t.catalyst) drawCatalystAt(t.position.x, t.position.y, t.angle, now);
    else drawTomeAt(t.position.x, t.position.y, t.angle, SPELLS[t.spell].color, now, spellTier(t.spell));
  }
  for (const h of hats) drawHatAt(h.position.x, h.position.y, h.angle, now);
}
