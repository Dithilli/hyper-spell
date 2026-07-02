// pickups.js — spell tomes raining from the sky
const tomes = new Set();
const TOME_SPELLS = ['gust', 'lightning', 'frost', 'blackhole', 'meteor'];
let nextTomeAt = 0, lastTomeSpell = null;

function scheduleTomes(now) {
  nextTomeAt = now + rand(3000, 6000);
}

function updateTomes(now) {
  if (now > nextTomeAt && tomes.size < 2) {
    let spell;
    do { spell = pick(TOME_SPELLS); } while (spell === lastTomeSpell);
    lastTomeSpell = spell;
    const tome = Bodies.rectangle(rand(120, W - 120), -40, 20, 24, { density: 0.001, frictionAir: 0.05, label: 'tome' });
    tome.spell = spell;
    tome.bornAt = now;
    tomes.add(tome);
    Composite.add(world, tome);
    nextTomeAt = now + rand(8000, 12000);
  }
  for (const t of [...tomes]) {
    if (now - t.bornAt > 20000) {
      spawnParticles(t.position.x, t.position.y, '#e8d5ff', 6, 3);
      tomes.delete(t);
      Composite.remove(world, t);
    }
  }
}

function pickupTome(tome, p) {
  if (!tomes.has(tome) || !p.alive) return;
  p.spellId = tome.spell;
  p.lastCast = 0;
  sfx.pickup();
  spawnParticles(tome.position.x, tome.position.y, SPELLS[tome.spell].color, 14, 5);
  tomes.delete(tome);
  Composite.remove(world, tome);
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
}
