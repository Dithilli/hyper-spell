// player.js — player lifecycle, movement, damage, wizard rendering
const PLAYER_DEFS = [
  { name: 'P1', color: '#4ecdc4', hat: '#2a9d94' },
  { name: 'P2', color: '#ff6b81', hat: '#c44558' },
  { name: 'P3', color: '#ffd166', hat: '#d4a52f' },
  { name: 'P4', color: '#a55eea', hat: '#7d3fc4' },
];

const players = [];
const gibs = new Set();

function createPlayer(slot, controller) {
  const def = PLAYER_DEFS[slot];
  const p = {
    ...def, slot, controller,
    group: Body.nextGroup(true),
    roundWins: 0, spellId: 'fireball', hp: 100,
    alive: false, facing: slot % 2 === 0 ? 1 : -1,
    walkPhase: 0, lastGround: 0, lastCast: 0,
    frozenUntil: 0, wasFrozen: false, input: { ...IDLE_INPUT },
  };
  p.body = Bodies.circle(0, -100, 15, {
    density: 0.004, friction: 0.05, frictionAir: 0.02, restitution: 0.2,
    label: 'player', collisionFilter: { group: p.group },
  });
  p.body.player = p;
  players.push(p);
  return p;
}

function spawnPlayer(p, pos) {
  if (!p.alive) Composite.add(world, p.body);
  p.alive = true;
  p.hp = 100;
  p.frozenUntil = 0;
  p.body.frictionAir = 0.02;
  Body.setPosition(p.body, pos);
  Body.setVelocity(p.body, { x: 0, y: 0 });
  Body.setAngularVelocity(p.body, 0);
  Body.setAngle(p.body, 0);
  spawnParticles(pos.x, pos.y, '#e8d5ff', 12, 5);
}

function despawnPlayer(p) {
  if (!p.alive) return;
  Composite.remove(world, p.body);
  p.alive = false;
}

function damagePlayer(p, amt) {
  if (!p || !p.alive) return;
  p.hp -= amt;
  if (p.hp <= 0) killPlayer(p);
}

function killPlayer(p) {
  if (!p.alive) return;
  p.alive = false;
  const { x, y } = p.body.position;
  spawnParticles(x, y, p.color, 24, 8, 60);
  addShake(10);
  sfx.death();
  doFlash(p.color, 0.12);
  if (game.state === 'PLAY') slowMo(0.3, 550);
  for (let i = 0; i < 6; i++) {
    const gib = Bodies.rectangle(x, y, 14, 4, { density: 0.001, frictionAir: 0.01, label: 'gib' });
    gib.color = p.color;
    gib.dieAt = performance.now() + 3000;
    Body.setVelocity(gib, { x: (Math.random() - 0.5) * 16, y: -6 - Math.random() * 8 });
    Body.setAngularVelocity(gib, (Math.random() - 0.5) * 0.6);
    gibs.add(gib);
    Composite.add(world, gib);
  }
  Composite.remove(world, p.body);
  game.onDeath(p);
}

function grounded(p) {
  const { x, y } = p.body.position;
  const below = Query.region(Composite.allBodies(world), { min: { x: x - 11, y: y + 14 }, max: { x: x + 11, y: y + 22 } });
  return below.some(b => b !== p.body && b.label !== 'projectile' && b.label !== 'lava' && b.label !== 'gib');
}

function updatePlayers(now) {
  for (const p of players) {
    if (!p.alive) continue;
    const body = p.body;
    const frozen = now < p.frozenUntil;
    if (p.wasFrozen && !frozen) {
      body.frictionAir = 0.02;
      spawnParticles(body.position.x, body.position.y, '#9be7ff', 10, 4);
    }
    p.wasFrozen = frozen;
    const c = p.input;
    if (!frozen && game.state !== 'VICTORY') {
      const onGround = grounded(p);
      if (onGround) p.lastGround = now;
      const canJump = now - p.lastGround < 120;
      if (c.move) p.facing = c.move > 0 ? 1 : -1;
      const target = c.move * 7;
      const blend = onGround ? (currentMap.def.icy ? 0.06 : 0.25) : 0.08;
      Body.setVelocity(body, { x: body.velocity.x + (target - body.velocity.x) * blend, y: body.velocity.y });
      if (c.jump && canJump && body.velocity.y > -2) {
        Body.setVelocity(body, { x: body.velocity.x, y: -15 });
        p.lastGround = 0;
        sfx.jump();
      }
      if (c.cast) castSpell(p, now);
    }
    Body.setAngularVelocity(body, body.angularVelocity * 0.9);
    p.walkPhase += Math.abs(body.velocity.x) * 0.04;
    if (body.position.y > H + 60) killPlayer(p);
  }
}

function drawWizardFigure(p, x, y, scale, now, angle = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.strokeStyle = p.color;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  const step = Math.sin(p.walkPhase) * 6;
  ctx.beginPath();
  ctx.moveTo(0, 4); ctx.lineTo(-4 + step, 15);
  ctx.moveTo(0, 4); ctx.lineTo(4 - step, 15);
  ctx.moveTo(0, 4); ctx.lineTo(0, -6);
  ctx.moveTo(0, -3); ctx.lineTo(-p.facing * 7, 5);
  ctx.moveTo(0, -3); ctx.lineTo(p.facing * 11, -5);
  ctx.stroke();

  ctx.fillStyle = p.color;
  ctx.beginPath(); ctx.arc(0, -11, 5.5, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = p.hat;
  ctx.beginPath();
  ctx.moveTo(-9, -14); ctx.lineTo(9, -14);
  ctx.lineTo(2 + p.facing * 3, -30); ctx.closePath(); ctx.fill();
  ctx.fillRect(-11, -16, 22, 3);

  const spell = SPELLS[p.spellId];
  if (now - p.lastCast > spell.cooldown) {
    ctx.fillStyle = spell.color;
    ctx.beginPath(); ctx.arc(p.facing * 12, -6, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawWizard(p, now) {
  const { x, y } = p.body.position;
  drawWizardFigure(p, x, y, 1, now, p.body.angle * 0.35);
  if (now < p.frozenUntil) {
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#9be7ff';
    ctx.fillRect(x - 17, y - 32, 34, 50);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#d8f4ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 17, y - 32, 34, 50);
  }
  if (p.hp < 100) {
    const pct = Math.max(0, p.hp / 100);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - 16, y - 42, 32, 5);
    ctx.fillStyle = pct > 0.5 ? '#7bd88f' : pct > 0.25 ? '#ffd166' : '#ff6b81';
    ctx.fillRect(x - 16, y - 42, 32 * pct, 5);
  }
}
