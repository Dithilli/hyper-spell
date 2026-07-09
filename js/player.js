// player.js — player lifecycle, movement, statuses, wizard rendering
const MAX_PLAYERS = 8;
const FALL_SAFE_DROP = 440; // px of safe fall — a double jump drops ~350 from its apex
const PLAYER_DEFS = [
  { name: 'P1', color: '#4ecdc4', hat: '#2a9d94' },
  { name: 'P2', color: '#ff6b81', hat: '#c44558' },
  { name: 'P3', color: '#ffd166', hat: '#d4a52f' },
  { name: 'P4', color: '#a55eea', hat: '#7d3fc4' },
  { name: 'P5', color: '#ff9f43', hat: '#c67a2e' },
  { name: 'P6', color: '#9acd32', hat: '#6b9023' },
  { name: 'P7', color: '#e8e8f0', hat: '#a8a8c0' },
  { name: 'P8', color: '#7f9cf5', hat: '#5a6fc2' },
];

// is there anything solid in the column at x to land on?
function groundInColumn(x) {
  return Composite.allBodies(currentMap.composite).some(b =>
    b.isStatic && !b.isSensor && b.label !== 'lava' && b.collisionFilter.mask !== 0 &&
    x > b.bounds.min.x + 6 && x < b.bounds.max.x - 6 && b.bounds.min.y > 100);
}

function spawnPointFor(p) {
  const spawns = currentMap.def.spawns;
  const base = spawns[p.slot % spawns.length];
  const jitter = p.slot >= spawns.length ? (p.slot - spawns.length + 1) * 26 * (p.slot % 2 ? 1 : -1) : 0;
  // safety net: a spawn over a straight drop gets moved onto a real platform
  if (!groundInColumn(base.x + jitter)) {
    const spot = platformSpots(currentMap, 3).find(s => groundInColumn(s.x));
    if (spot) return { x: spot.x, y: Math.max(80, spot.y - 150) };
  }
  return { x: Math.max(40, Math.min(W - 40, base.x + jitter)), y: base.y };
}

const players = [];
const gibs = new Set();

function createPlayer(slot, controller) {
  const def = PLAYER_DEFS[slot];
  const p = {
    ...def, slot, controller,
    group: Body.nextGroup(true),
    roundWins: 0, hp: 100,
    alive: false, facing: slot % 2 === 0 ? 1 : -1,
    walkPhase: 0, lastGround: 0, airJumps: 1,
    sizeScale: 1, megaCasts: 0, megaUntil: 0,
    frozenUntil: 0, wasFrozen: false, input: { ...IDLE_INPUT },
    // two spell slots (A, B), each with its own last-cast time; lastCastSlot is
    // the one most recently fired (drives the spellId/lastCast accessors below)
    slots: [null, null], casts: [0, 0], slotFilledAt: [0, 0], lastCastSlot: 0,
  };
  // spellId/lastCast are accessors over the "primary" slot so the many existing
  // single-spell read-sites (telemetry attribution, HUD glow, mirrorcast, bots)
  // keep working. Writing spellId = null clears BOTH slots (disarm, round reset).
  Object.defineProperties(p, {
    spellId: {
      enumerable: true, configurable: true,
      get() { return p.slots[p.lastCastSlot] ?? p.slots[0] ?? p.slots[1] ?? null; },
      set(v) { if (v == null) { p.slots[0] = p.slots[1] = null; } else { p.slots[0] = v; } },
    },
    lastCast: {
      enumerable: true, configurable: true,
      get() { return p.casts[p.lastCastSlot] ?? 0; },
      set(v) { p.casts[p.lastCastSlot] = v; },
    },
  });
  p.body = Bodies.circle(0, -100, 15, {
    density: 0.004, friction: 0.05, frictionAir: 0.02, restitution: 0.2,
    label: 'player', collisionFilter: { group: p.group },
  });
  p.body.player = p;
  players.push(p);
  return p;
}

function clearStatuses(p) {
  p.frozenUntil = 0; p.burnUntil = 0; p.nextBurnTick = 0; p.wetUntil = 0;
  p.reversedUntil = 0; p.slipUntil = 0; p.floatyUntil = 0;
  p.heavyUntil = 0; p.speedUntil = 0; p.jumpBoostUntil = 0;
  p.invulnUntil = 0; p.reflectUntil = 0; p.shrinkUntil = 0;
  p.growUntil = 0; p.pigUntil = 0; p.megaCasts = 0; p.megaUntil = 0;
}

function setPlayerScale(p, target) {
  const ratio = target / p.sizeScale;
  if (Math.abs(ratio - 1) < 0.01) return;
  Body.scale(p.body, ratio, ratio);
  p.sizeScale = target;
  spawnParticles(p.body.position.x, p.body.position.y, '#e8d5ff', 6, 3);
}

function spawnPlayer(p, pos) {
  if (!p.alive) Composite.add(world, p.body);
  p.alive = true;
  p.hp = 100;
  p.airJumps = 1;
  p.fallPeak = 0;
  p.gravityLockUntil = 0;
  p.ghost = null;
  p.lastHitBy = null;
  clearStatuses(p);
  setPlayerScale(p, 1);
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

function healPlayer(p, amt) {
  if (!p.alive) return;
  p.hp = Math.min(100, p.hp + amt);
  spawnText(p.body.position.x, p.body.position.y - 34, `+${Math.round(amt)}`, '#7bd88f');
}

// put a picked-up spell into a slot: fill an empty one, else replace the oldest.
// Returns the slot index used. Fusion (Phase 4b) hooks off the resulting pair.
function addSpell(p, id) {
  const now = performance.now();
  let i = p.slots[0] == null ? 0 : p.slots[1] == null ? 1
    : (p.slotFilledAt[0] <= p.slotFilledAt[1] ? 0 : 1);
  p.slots[i] = id;
  p.casts[i] = 0;          // ready to cast immediately
  p.slotFilledAt[i] = now;
  return i;
}

function clearSpells(p) {
  p.slots[0] = p.slots[1] = null;
  p.casts[0] = p.casts[1] = 0;
  p.slotFilledAt[0] = p.slotFilledAt[1] = 0;
  p.lastCastSlot = 0;
}

function damagePlayer(p, amt, src) {
  if (!p || !p.alive) return;
  const now = performance.now();
  if (now < (p.invulnUntil || 0)) {
    spawnText(p.body.position.x, p.body.position.y - 34, 'BLOCKED', '#e8d5ff');
    return;
  }
  if (src && src.slot !== undefined) p.lastHitBy = { player: src, at: now }; // kill credit window
  let n = Math.round(amt);
  if (n <= 0) return;
  // SHATTER synergy: a solid blow to a frozen wizard cracks the ice for bonus
  // damage and breaks the freeze (thawing → leaves them Wet, which conducts).
  if (now < (p.frozenUntil || 0) && n >= 8) {
    n += Math.max(8, Math.round(n * 0.6));
    p.frozenUntil = 0;
    spawnText(p.body.position.x, p.body.position.y - 48, 'SHATTER!', '#bfe8ff');
    spawnParticles(p.body.position.x, p.body.position.y, '#bfe8ff', 16, 6);
    sfx.freeze?.();
  }
  if (src && src.spellId) telDmg(src.spellId, n); // balance: damage credited to the attacker's spell
  const hadHat = p.hp >= 50;
  p.hp -= n;
  p.hurtUntil = now + 130;
  if (p.hp <= 0) killPlayer(p);
  else {
    spawnText(p.body.position.x, p.body.position.y - 34, `-${n}`, '#ffffff');
    if (hadHat && p.hp < 50) knockHatOff(p);
  }
}

// crossing below half health knocks the wizard's hat off — the ultimate shame
function knockHatOff(p) {
  const { x, y } = p.body.position;
  const s = p.sizeScale || 1;
  const hat = Bodies.polygon(x, y - 22 * s, 3, 8, { density: 0.0008, frictionAir: 0.02, angle: -Math.PI / 2, label: 'gib' });
  hat.color = p.hat;
  hat.dieAt = performance.now() + 3500;
  Body.setVelocity(hat, { x: p.body.velocity.x * 0.5 + rand(-3, 3), y: -7 * (engine.gravity.y < 0 ? -1 : 1) });
  Body.setAngularVelocity(hat, rand(-0.4, 0.4));
  gibs.add(hat);
  Composite.add(world, hat);
  statFor(p).hatsLost++;
  spawnText(x, y - 52 * s, 'THE SHAME!', p.hat);
  sfx.squeak();
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
  if (game.state === 'PLAY') {
    creditKill(p);
    p.ghost = { x, y: y - 10, nextGust: 0 }; // linger as a wisp until the round ends
  }
  game.onDeath(p);
}

// ---------- ghosts: dead wizards drift as faint wisps and can nudge things ----------
function updateGhosts(now) {
  if (game.state !== 'PLAY') return;
  for (const p of players) {
    if (p.alive || !p.ghost) continue;
    const c = p.input, g = p.ghost;
    g.x = Math.max(20, Math.min(W - 20, g.x + (c.move || 0) * 3.2));
    g.y = Math.max(30, Math.min(H - 40, g.y + (c.jump ? -2.6 : 1.0)));
    if (c.cast && now > g.nextGust) {
      g.nextGust = now + 2800;
      ghostGust(g);
    }
  }
}

// a gentle, harmless push — enough to tip a crate or ruffle a duel, never to kill
function ghostGust(g) {
  spawnRing(g.x, g.y, 'rgba(232,213,255,0.6)');
  sfx.cast();
  for (const b of Composite.allBodies(world)) {
    if (b.isStatic || b.isSensor || b.label === 'boss') continue;
    const dx = b.position.x - g.x, dy = b.position.y - g.y;
    const d = Math.hypot(dx, dy);
    if (d > 110 || d === 0) continue;
    const s = (1 - d / 110) * 4.5;
    Body.setVelocity(b, { x: b.velocity.x + (dx / d) * s, y: b.velocity.y + (dy / d) * s - 1.2 * (1 - d / 110) });
  }
}

// very subtle: a drifting mote with a fading tail — pointedly NOT a wizard
function drawWisp(name, color, x, y, now) {
  const seed = (name || '').length * 1.7;
  const bob = Math.sin(now * 0.0035 + seed) * 3;
  const yy = y + bob;
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = color;
  for (let i = 1; i <= 3; i++) { // tail
    ctx.beginPath();
    ctx.arc(x - Math.sin(now * 0.0035 + seed - i * 0.9) * 4, yy + i * 7, 4 - i, 0, Math.PI * 2);
    ctx.fill();
  }
  const g = ctx.createRadialGradient(x, yy, 0, x, yy, 9);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.22 + 0.05 * Math.sin(now * 0.005 + seed);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, yy, 9, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.16;
  ctx.font = '9px Georgia';
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.fillText(name, x, yy - 13);
  ctx.globalAlpha = 1;
}

function drawGhostWisps(now) {
  if (game.state !== 'PLAY' && game.state !== 'ROUND_END') return;
  for (const p of players) {
    if (!p.alive && p.ghost) drawWisp(p.name, p.color, p.ghost.x, p.ghost.y, now);
  }
}

// gravity direction as this player experiences it (Gravity Flip spares its caster)
function gravDirFor(p) {
  if (p && performance.now() < (p.gravityLockUntil || 0)) return p.gravityLockDir;
  return engine.gravity.y < 0 ? -1 : 1;
}

function grounded(p) {
  const { x, y } = p.body.position;
  const s = p.sizeScale || 1;
  const dir = gravDirFor(p); // support is above you when gravity flips
  const y0 = y + 14 * s * dir, y1 = y + 22 * s * dir;
  const below = Query.region(Composite.allBodies(world), {
    min: { x: x - 11 * s, y: Math.min(y0, y1) },
    max: { x: x + 11 * s, y: Math.max(y0, y1) },
  });
  return below.some(b => b !== p.body && b.label !== 'projectile' && b.label !== 'lava' && b.label !== 'gib' && b.collisionFilter.mask !== 0);
}

function updatePlayers(now) {
  for (const p of players) {
    if (!p.alive) continue;
    const body = p.body;
    const frozen = now < p.frozenUntil;
    const slipped = now < (p.slipUntil || 0);
    const piggy = now < (p.pigUntil || 0);

    // size management: mega base × status modifier
    const base = (p.megaCasts > 0 || now < p.megaUntil) ? 2 : 1;
    let mod = 1;
    if (now < (p.shrinkUntil || 0) || piggy) mod = 0.6;
    else if (now < (p.growUntil || 0)) mod = 1.5;
    const desired = base * mod;
    if (Math.abs(desired - p.sizeScale) > 0.01) setPlayerScale(p, desired);

    // burn damage over time
    if (now < (p.burnUntil || 0) && now > (p.nextBurnTick || 0)) {
      p.nextBurnTick = now + 450;
      damagePlayer(p, 3);
      spawnParticles(body.position.x, body.position.y - 10, '#ff8c5a', 3, 3, 20);
    }

    // floaty: balloon-style anti-gravity
    if (now < (p.floatyUntil || 0)) {
      Body.applyForce(body, body.position, { x: 0, y: -engine.gravity.y * engine.gravity.scale * body.mass * 1.5 });
    }

    if (p.wasFrozen && !frozen) {
      body.frictionAir = 0.02;
      spawnParticles(body.position.x, body.position.y, '#9be7ff', 10, 4);
      p.wetUntil = now + 4500; // just thawed → Wet (conducts lightning)
    }
    p.wasFrozen = frozen;
    // standing on ice/snow keeps you Wet; a faint sheen hints at it
    if (currentMap.def.icy || currentMap.data.eventIcy) p.wetUntil = Math.max(p.wetUntil || 0, now + 600);
    if (now < (p.wetUntil || 0) && Math.random() < 0.04) spawnParticles(body.position.x, body.position.y + 8, '#9ec9ff', 1, 1.5, 16);

    const c = p.input;
    const gdir = gravDirFor(p);
    // gravity-locked (a Gravity Flip caster): cancel the flipped world pull, keep your own
    if (now < (p.gravityLockUntil || 0)) {
      const want = p.gravityLockDir * Math.abs(engine.gravity.y);
      Body.applyForce(body, body.position, { x: 0, y: (want - engine.gravity.y) * engine.gravity.scale * body.mass });
    }
    const onGround = grounded(p);
    // fall damage: a long drop ending in a hard landing hurts. Terminal velocity
    // is too low to tell falls apart, so track the drop DISTANCE from the
    // gravity-relative apex; the speed floor spares floaty/low-gravity landings.
    const vAlong = body.velocity.y * gdir;
    if (vAlong > (p.fallPeak || 0)) p.fallPeak = vAlong;
    const yAlong = body.position.y * gdir;
    if (p.lastGdir !== gdir) { p.apexAlong = null; p.fallPeak = 0; p.lastGdir = gdir; }
    if (!onGround) {
      if (p.apexAlong == null || yAlong < p.apexAlong) p.apexAlong = yAlong;
    } else if (vAlong < 2) {
      if (p.apexAlong != null && game.state === 'PLAY' && now > (game.fightAt || 0) && now > (p.floatyUntil || 0)) {
        const drop = yAlong - p.apexAlong;
        if (drop > FALL_SAFE_DROP && p.fallPeak > 14) {
          const dmg = Math.min(40, Math.round((drop - FALL_SAFE_DROP) * 0.12));
          if (dmg >= 3) {
            statFor(p).fallDmg += dmg;
            damagePlayer(p, dmg);
            addShake(4);
            sfx.thud();
            spawnParticles(body.position.x, body.position.y + 14 * gdir, '#9c8ab8', 8, 3, 25);
          }
        }
      }
      p.apexAlong = null;
      p.fallPeak = 0;
    }
    if (!frozen && !slipped && game.state !== 'VICTORY') {
      if (onGround) { p.lastGround = now; p.airJumps = 1; }
      const canJump = now - p.lastGround < 120;
      let move = c.move;
      if (now < (p.reversedUntil || 0)) move = -move;
      // aim: mouse point or right stick beats movement facing
      if (c.aimVec) p.aimAngle = Math.atan2(c.aimVec.y, c.aimVec.x);
      else if (c.aimPoint) p.aimAngle = Math.atan2(c.aimPoint.y - body.position.y, c.aimPoint.x - body.position.x);
      else if (c.aimAngle != null) p.aimAngle = c.aimAngle; // network players send a precomputed angle
      else p.aimAngle = null;
      if (p.aimAngle != null && Math.abs(Math.cos(p.aimAngle)) > 0.25) p.facing = Math.cos(p.aimAngle) > 0 ? 1 : -1;
      else if (move) p.facing = move > 0 ? 1 : -1;
      let target = move * 6;
      if (now < (p.speedUntil || 0)) target *= 1.6;
      if (now < (p.heavyUntil || 0)) target *= 0.5;
      if (currentMap.def.muddy || now < (p.vineSlowUntil || 0)) target *= 0.65;
      const icy = currentMap.def.icy || currentMap.data.eventIcy;
      const blend = onGround ? (icy ? 0.09 : currentMap.def.muddy ? 0.12 : 0.25) : 0.08;
      Body.setVelocity(body, { x: body.velocity.x + (target - body.velocity.x) * blend, y: body.velocity.y });

      const heavy = now < (p.heavyUntil || 0);
      // jump away from whatever you stand on (gdir computed above, per player)
      const jumpVy = (now < (p.jumpBoostUntil || 0) ? -22 : (p.sizeScale > 1.6 ? -17 : -15)) * gdir;
      if (!heavy) {
        if (c.jump && canJump && body.velocity.y * gdir > -2) {
          Body.setVelocity(body, { x: body.velocity.x, y: jumpVy });
          p.lastGround = 0;
          sfx.jump();
        } else if (c.jumpPressed && !canJump && p.airJumps > 0) {
          p.airJumps--;
          Body.setVelocity(body, { x: body.velocity.x, y: (now < (p.jumpBoostUntil || 0) ? -19 : -13) * gdir });
          spawnParticles(body.position.x, body.position.y + 12 * gdir, '#e8d5ff', 8, 3, 20);
          sfx.jump();
        }
      }
      if (!piggy && now > (game.fightAt || 0)) {
        if (c.cast && p.slots[0]) castSpell(p, now, 0);
        if (c.cast2 && p.slots[1]) castSpell(p, now, 1);
      }
    }
    // right yourself after a blow (skip while slipping on a banana)
    if (!slipped) Body.setAngle(body, body.angle * 0.88);
    Body.setAngularVelocity(body, body.angularVelocity * 0.9);
    p.walkPhase += Math.abs(body.velocity.x) * 0.06;
    if (body.position.y > H + 60) killPlayer(p);
    if (currentMap.def.wrap) {
      if (body.position.x < -20) Body.setPosition(body, { x: W + 15, y: body.position.y });
      if (body.position.x > W + 20) Body.setPosition(body, { x: -15, y: body.position.y });
    }
  }
}

function drawWizardFigure(p, x, y, scale, now, angle = 0) {
  const piggy = now < (p.pigUntil || 0);
  const col = piggy ? '#ff9ecb' : p.color;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.strokeStyle = col;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  // legs: two segments with knee bend and foot lift, stride scales with speed
  const f = Math.min(1, Math.abs(p.body.velocity.x) / 6);
  ctx.beginPath();
  for (const side of [0, Math.PI]) {
    const ph = p.walkPhase + side;
    const footX = Math.sin(ph) * 9 * f * p.facing + (side ? 4 : -4) * (1 - f);
    const lift = Math.max(0, Math.cos(ph)) * 5 * f;
    const kneeX = footX * 0.45 + p.facing * 2 * f;
    ctx.moveTo(0, 4);
    ctx.lineTo(kneeX, 9 - lift * 0.6);
    ctx.lineTo(footX, 15 - lift);
  }
  ctx.moveTo(0, 4); ctx.lineTo(0, -6);
  const armSwing = Math.sin(p.walkPhase) * 4 * f;
  ctx.moveTo(0, -3); ctx.lineTo(-p.facing * (7 - armSwing), 5 - Math.abs(armSwing) * 0.4);
  ctx.moveTo(0, -3); ctx.lineTo(p.facing * 11, -5);
  ctx.stroke();

  ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(0, -11, 5.5, 0, Math.PI * 2); ctx.fill();
  if (piggy) {
    ctx.fillStyle = '#ff7eb6';
    ctx.beginPath(); ctx.arc(p.facing * 5, -10, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  // the hat IS the health indicator: proud ≥75, knocked askew 50–74,
  // gone below 50 (the shame), and under 25 the wizard smolders.
  const hp = p.hp ?? 100;
  if (hp >= 50) {
    ctx.save();
    if (hp < 75) {
      ctx.translate(p.facing * 2, -14);
      ctx.rotate(p.facing * 0.38);
      ctx.translate(0, 14);
    }
    ctx.fillStyle = p.hat;
    ctx.beginPath();
    ctx.moveTo(-9, -14); ctx.lineTo(9, -14);
    ctx.lineTo(2 + p.facing * 3, -30); ctx.closePath(); ctx.fill();
    ctx.fillRect(-11, -16, 22, 3);
    ctx.restore();
  }
  if (hp < 25 && p.alive !== 0 && p.alive !== false) {
    ctx.fillStyle = 'rgba(160,150,170,0.5)';
    for (let i = 0; i < 3; i++) {
      const t = (now * 0.05 + i * 37) % 30;
      ctx.globalAlpha = 0.45 * (1 - t / 30);
      ctx.beginPath();
      ctx.arc(Math.sin(now * 0.004 + i * 2.4) * 4, -18 - t, 2 + t * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const spell = p.spellId && SPELLS[p.spellId];
  if (spell && now - p.lastCast > spell.cooldown) {
    ctx.fillStyle = spell.color;
    ctx.beginPath(); ctx.arc(p.facing * 12, -6, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawNameTag(name, color, x, y) {
  ctx.font = 'bold 11px Georgia';
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = 'rgba(10, 6, 16, 0.85)'; // halo so any color reads on any backdrop
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.strokeText(name, x, y);
  ctx.fillStyle = color;
  ctx.fillText(name, x, y);
  ctx.globalAlpha = 1;
}

function drawWizard(p, now) {
  const { x, y } = p.body.position;
  const s = p.sizeScale || 1;
  drawNameTag(p.name, p.color, x, y - 48 * s);
  if (s > 1.6) {
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 18;
  }
  drawWizardFigure(p, x, y, s, now, p.body.angle * 0.35);
  ctx.shadowBlur = 0;
  if (now < (p.floatyUntil || 0)) {
    ctx.strokeStyle = '#ff6b81';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y - 26 * s); ctx.lineTo(x + 3, y - 44 * s); ctx.stroke();
    ctx.fillStyle = '#ff6b81';
    ctx.beginPath(); ctx.arc(x + 3, y - 52 * s, 9, 0, Math.PI * 2); ctx.fill();
  }
  if (now < (p.invulnUntil || 0) || now < (p.reflectUntil || 0)) {
    ctx.strokeStyle = now < (p.reflectUntil || 0) ? '#4ecdff' : '#ffd700';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(now * 0.02);
    ctx.beginPath(); ctx.arc(x, y - 8 * s, 24 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (now < (p.hurtUntil || 0)) {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(x, y - 8 * s, 19 * s, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (now < p.frozenUntil) {
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#9be7ff';
    ctx.fillRect(x - 17 * s, y - 32 * s, 34 * s, 50 * s);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#d8f4ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 17 * s, y - 32 * s, 34 * s, 50 * s);
  }
  // no health bars — the hat tells the story (see drawWizardFigure)
}
