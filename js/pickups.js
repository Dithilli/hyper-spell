// pickups.js — spell tomes and the rare Mega Hat raining from the sky
const tomes = new Set();
const hats = new Set();
let nextTomeAt = 0, lastTomeSpell = null;
function tomePool() {
  return Object.keys(SPELLS);
}

function scheduleTomes(now) {
  nextTomeAt = now + rand(1200, 2500);
}

function updateTomes(now) {
  if (now > nextTomeAt && tomes.size < 3) {
    const megaOut = hats.size > 0 || players.some(p => p.megaCasts > 0);
    if (!megaOut && Math.random() < 0.14) spawnHat(now);
    else spawnTome(now);
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
  do { spell = pick(pool); } while (spell === lastTomeSpell && pool.length > 1);
  lastTomeSpell = spell;
  const spot = tomeDropSpot();
  const tome = Bodies.rectangle(spot.x, spot.y, 20, 24, { density: 0.001, frictionAir: 0.05, label: 'tome' });
  tome.spell = spell;
  tome.bornAt = now;
  tomes.add(tome);
  Composite.add(world, tome);
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
  p.spellId = tome.spell;
  p.lastCast = 0;
  sfx.pickup();
  spawnParticles(tome.position.x, tome.position.y, SPELLS[tome.spell].color, 14, 5);
  spawnText(p.body.position.x, p.body.position.y - 48, SPELLS[tome.spell].name.toUpperCase() + '!', SPELLS[tome.spell].color);
  tomes.delete(tome);
  Composite.remove(world, tome);
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

function drawTomes(now) {
  for (const t of tomes) {
    const c = SPELLS[t.spell].color;
    ctx.save();
    ctx.translate(t.position.x, t.position.y);
    ctx.rotate(t.angle);
    ctx.shadowColor = c;
    ctx.shadowBlur = 12 + 6 * Math.sin(now * 0.008);
    ctx.fillStyle = '#3a2f4d';
    ctx.fillRect(-10, -12, 20, 24);
    ctx.fillStyle = c;
    ctx.fillRect(-10, -12, 4, 24);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = c;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-10, -12, 20, 24);
    ctx.restore();
  }
  for (const h of hats) {
    ctx.save();
    ctx.translate(h.position.x, h.position.y);
    ctx.rotate(h.angle);
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
}
