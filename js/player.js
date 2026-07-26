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

// wizards are beefier than the classic 100 so rounds run long enough to grab a
// few tomes, land a fusion, and actually SEE the rare spells before someone dies
const MAX_HP = 150;

function createPlayer(slot, controller) {
  const def = PLAYER_DEFS[slot];
  const p = {
    ...def, slot, controller,
    group: Body.nextGroup(true),
    roundWins: 0, hp: MAX_HP,
    alive: false, facing: slot % 2 === 0 ? 1 : -1,
    walkPhase: 0, lastGround: 0, airJumps: 1,
    sizeScale: 1, megaCasts: 0, megaUntil: 0,
    frozenUntil: 0, wasFrozen: false, input: { ...IDLE_INPUT },
    // two spell slots (A, B), each with its own last-cast time; lastCastSlot is
    // the one most recently fired (drives the spellId/lastCast accessors below)
    slots: [null, null], casts: [0, 0], slotFilledAt: [0, 0], lastCastSlot: 0,
    slotCharges: [null, null], // hybrid fusion charges; null = a normal, limitless spell
  };
  // spellId/lastCast are accessors over the "primary" slot so the many existing
  // single-spell read-sites (telemetry attribution, HUD glow, mirrorcast, bots)
  // keep working. Writing spellId = null clears BOTH slots (disarm, round reset).
  Object.defineProperties(p, {
    spellId: {
      enumerable: true, configurable: true,
      get() { return p.slots[p.lastCastSlot] ?? p.slots[0] ?? p.slots[1] ?? null; },
      set(v) { if (v == null) { p.slots[0] = p.slots[1] = null; p.slotCharges[0] = p.slotCharges[1] = null; } else { p.slots[0] = v; p.slotCharges[0] = null; } },
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
  p.reversedUntil = 0; p.slipUntil = 0; p.floatyUntil = 0; p.featherUntil = 0;
  p.heavyUntil = 0; p.speedUntil = 0; p.jumpBoostUntil = 0;
  p.invulnUntil = 0; p.reflectUntil = 0; p.shrinkUntil = 0;
  p.growUntil = 0; p.pigUntil = 0; p.megaCasts = 0; p.megaUntil = 0;
  p.blockCdUntil = 0;
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
  p.hp = MAX_HP;
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
  p.hp = Math.min(MAX_HP, p.hp + amt);
  spawnText(p.body.position.x, p.body.position.y - 34, `+${Math.round(amt)}`, '#7bd88f');
}

// put a picked-up spell into a slot: fill an empty one, else replace the oldest.
// Returns the slot index used (-1 if nothing could be replaced). Fusion (Phase 4b)
// hooks off the resulting pair.
function addSpell(p, id) {
  const now = performance.now();
  // a charged fusion is precious — a stray tome grab must never overwrite it.
  // Route the new spell to the other hand; the slot frees itself at burnout.
  const locked = s => p.slots[s] != null && p.slotCharges[s] > 0;
  let i = p.slots[0] == null ? 0 : p.slots[1] == null ? 1
    : (p.slotFilledAt[0] <= p.slotFilledAt[1] ? 0 : 1);
  if (locked(i)) i = 1 - i;
  if (locked(i)) { // both hands hold charged fusions — the tome fizzles
    spawnText(p.body.position.x, p.body.position.y - 48, 'HANDS FULL!', '#ff4df0');
    return -1;
  }
  p.slots[i] = id;
  p.casts[i] = 0;          // ready to cast immediately
  p.slotCharges[i] = null; // tome spells are limitless; only fusion sets charges
  p.slotFilledAt[i] = now;
  return i;
}

function clearSpells(p) {
  p.slots[0] = p.slots[1] = null;
  p.casts[0] = p.casts[1] = 0;
  p.slotCharges[0] = p.slotCharges[1] = null;
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
  const hadHat = p.hp >= MAX_HP * 0.5;
  p.hp -= n;
  p.hurtUntil = now + 130;
  if (p.hp <= 0) killPlayer(p);
  else {
    spawnText(p.body.position.x, p.body.position.y - 34, `-${n}`, '#ffffff');
    if (hadHat && p.hp < MAX_HP * 0.5) knockHatOff(p);
  }
}

// BLOCK: a split-second parry on its own button. While it's up you take no
// damage and projectiles bounce back at the sender (the reflect path). It's a
// timed read, not a turtle: ~a quarter second of safety, then a real cooldown.
const BLOCK_MS = 240, BLOCK_CD = 1400;
function tryBlock(p, now) {
  if (now < (p.blockCdUntil || 0) || now < (p.frozenUntil || 0)) return;
  p.blockCdUntil = now + BLOCK_CD;
  p.invulnUntil = Math.max(p.invulnUntil || 0, now + BLOCK_MS);
  p.reflectUntil = Math.max(p.reflectUntil || 0, now + BLOCK_MS);
  spawnRing(p.body.position.x, p.body.position.y, '#4ecdff');
  sfx.clang?.();
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

// ---------- ghosts: dead wizards drift as faint wisps and meddle, gently ----------
// Hold cast near a loose prop to poltergeist-carry it (release to toss it,
// softly). Cast in the open = the classic gust. Cast B drops a haunt sigil
// everyone can see (point at tomes, ambushes, or just taunt). The parry button
// lets out a wail: the living shiver, bots panic for a beat. Drifting through
// a wizard chills them. All of it stays mischief — a ghost can inconvenience
// the living, never kill them.
const GHOST_CARRY = new Set(['crate', 'barrel', 'ball', 'plank']);
function updateGhosts(now) {
  if (game.state !== 'PLAY') return;
  for (const p of players) {
    if (p.alive || !p.ghost) continue;
    const c = p.input, g = p.ghost;
    g.x = Math.max(20, Math.min(W - 20, g.x + (c.move || 0) * 3.2));
    g.y = Math.max(30, Math.min(H - 40, g.y + (c.jump ? -2.6 : 1.0)));

    // poltergeist carry: the prop floats on a soft spring below the wisp
    if (g.hold) {
      const held = g.hold;
      const gone = !Composite.get(world, held.id, 'body');
      const far = !gone && Math.hypot(held.position.x - g.x, held.position.y - g.y - 26) > 140;
      if (!c.cast || gone || far) {
        if (!gone) Body.setVelocity(held, { x: (c.move || 0) * 5, y: -2 }); // a toss, not a throw
        g.hold = null;
      } else {
        Body.setVelocity(held, {
          x: Math.max(-6, Math.min(6, (g.x - held.position.x) * 0.18)),
          y: Math.max(-6, Math.min(6, (g.y + 26 - held.position.y) * 0.18)),
        });
        Body.setAngularVelocity(held, held.angularVelocity * 0.9);
        if (Math.random() < 0.2) particles.push({ kind: 'spark', x: held.position.x + rand(-8, 8), y: held.position.y + rand(-8, 8), vx: 0, vy: -0.6, life: 14, maxLife: 14, color: '#e8d5ff', r: 1.5 });
      }
    } else if (c.cast) {
      // grab if a loose prop is in reach, otherwise the classic gust
      let best = null, bd = 1e9;
      for (const b of Composite.allBodies(world)) {
        if (b.isStatic || b.isSensor || !GHOST_CARRY.has(b.label) || b.mass > 8) continue;
        const d = Math.hypot(b.position.x - g.x, b.position.y - g.y);
        if (d < 70 && d < bd) { bd = d; best = b; }
      }
      if (best) {
        g.hold = best;
        spawnRing(g.x, g.y, '#e8d5ff');
      } else if (now > g.nextGust) {
        g.nextGust = now + 2800;
        ghostGust(g);
      }
    }

    if (c.cast2Pressed && now > (g.nextMark || 0)) {
      g.nextMark = now + 6000;
      ghostMark(p, g, now);
    }
    if (c.blockPressed && now > (g.nextWail || 0)) {
      g.nextWail = now + 5000;
      ghostWail(p, g, now);
    }

    // chill touch: drifting through the living leaves frost in their joints
    for (const q of players) {
      if (!q.alive) continue;
      if (Math.hypot(q.body.position.x - g.x, q.body.position.y - g.y) > 30) continue;
      if (now < (q.ghostChillUntil || 0)) continue;
      q.ghostChillUntil = now + 1600; // per-victim breather
      q.vineSlowUntil = Math.max(q.vineSlowUntil || 0, now + 550);
      spawnParticles(q.body.position.x, q.body.position.y - 20, '#bfe8ff', 6, 2, 24);
      sfx.freeze?.();
    }
  }
}

// a haunt sigil at the wisp: visible to every screen for a few seconds — the
// dead pointing at tomes, ambushes, or nothing in particular, out of spite
function ghostMark(p, g, now) {
  const mx = g.x, my = g.y;
  sfx.cast();
  spawnRing(mx, my, p.color);
  activeEffects.push({
    until: now + 4000,
    net: { k: 'zone', x: mx, y: my, r: 30, c: p.color }, // LAN clients see the pulse
    draw(nw) {
      ctx.globalAlpha = 0.75;
      runeRing(ctx, mx, my, 24, p.color, nw, { count: 6, lw: 1.2, alpha: 0.8, spin: 0.003 });
      ctx.globalAlpha = 1;
    },
  });
}

// the wail: nearby wizards shiver-slow for a beat; bots drop their plan and
// scurry. Purely a scare — no damage, no displacement.
function ghostWail(p, g, now) {
  sfx.blackhole?.();
  spawnRing(g.x, g.y, '#e8d5ff');
  spawnBurst(g.x, g.y, '#e8d5ff', 14, { speed: 3.5, g: -0.04, life: 40, r: 2.5 });
  for (const q of players) {
    if (!q.alive) continue;
    if (Math.hypot(q.body.position.x - g.x, q.body.position.y - g.y) > 170) continue;
    q.vineSlowUntil = Math.max(q.vineSlowUntil || 0, now + 450);
    q.spookedUntil = now + 900; // bots read this and panic; humans just shiver
    spawnParticles(q.body.position.x, q.body.position.y - 24, '#e8d5ff', 5, 2, 20);
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

// edge pointers for wizards knocked offscreen (usually skyward). A color-coded
// chevron rides the screen edge at the wizard's clamped position and points
// along their velocity — while they're soaring it aims up/away; the moment it
// tips downward it's marking the column they're about to land in. Shared by
// the live draw, LAN clients, and the killcam. list: [{x, y, vx, vy, color}]
function drawOffscreenPointers(list, now) {
  // Bounds are the camera's view rect, not the arena — once the camera zooms in,
  // "off screen" starts well inside the world, and that's exactly when these
  // arrows matter most. Sizes divide by zoom so they stay constant on screen.
  const v = cameraViewRect();
  const z = CAM.zoom;
  const INSET = 22 / z, EDGE = 18 / z;
  for (const w of list) {
    if (w.x > v.x0 - EDGE && w.x < v.x1 + EDGE && w.y > v.y0 - EDGE && w.y < v.y1 + EDGE) continue;
    const ax = Math.max(v.x0 + INSET, Math.min(v.x1 - INSET, w.x));
    const ay = Math.max(v.y0 + INSET, Math.min(v.y1 - INSET, w.y));
    const speed = Math.hypot(w.vx || 0, w.vy || 0);
    // point along travel; a near-still wizard (frozen mid-air) points at them
    const ang = speed > 0.8 ? Math.atan2(w.vy, w.vx) : Math.atan2(w.y - ay, w.x - ax);
    const dist = Math.hypot(w.x - ax, w.y - ay);
    const s = Math.max(9, 15 - dist * 0.012) / z * (1 + 0.12 * Math.sin(now * 0.012));
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(ang);
    ctx.fillStyle = w.color;
    ctx.strokeStyle = 'rgba(13,10,20,0.9)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(s, 0);
    ctx.lineTo(-s * 0.7, s * 0.62);
    ctx.lineTo(-s * 0.35, 0);
    ctx.lineTo(-s * 0.7, -s * 0.62);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
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
    else if (now < (p.growUntil || 0)) mod = 1.85; // past the 1.6 jump-boost threshold so "big" actually buffs you (bigger jump + more mass to shove/resist)
    const desired = base * mod;
    if (Math.abs(desired - p.sizeScale) > 0.01) setPlayerScale(p, desired);

    // burn damage over time
    if (now < (p.burnUntil || 0) && now > (p.nextBurnTick || 0)) {
      p.nextBurnTick = now + 450;
      damagePlayer(p, 3);
      spawnParticles(body.position.x, body.position.y - 10, '#ff8c5a', 3, 3, 20);
    }

    // floaty: balloon-style anti-gravity (1.5× lift — the balloon-hexed drift UP).
    // feather: gentle 0.72× counter-gravity — you fall slowly but never rise.
    const lift = now < (p.floatyUntil || 0) ? 1.5 : now < (p.featherUntil || 0) ? 0.72 : 0;
    if (lift) {
      Body.applyForce(body, body.position, { x: 0, y: -engine.gravity.y * engine.gravity.scale * body.mass * lift });
      if (lift < 1 && Math.random() < 0.06) spawnParticles(body.position.x + rand(-10, 10), body.position.y - 18, '#fffde7', 1, 1.2, 22);
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
      if (p.apexAlong != null && game.state === 'PLAY' && now > (game.fightAt || 0) && now > (p.floatyUntil || 0) && now > (p.featherUntil || 0)) {
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
        if (c.blockPressed) tryBlock(p, now);
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

// the hat IS the health indicator: proud ≥75, knocked askew 50–74,
// gone below 50 (the shame), and under 25 the wizard smolders.
// Rendering lives in artkit.js (drawStoryWizard) so the game and the review
// gallery share one source of truth; this adapter just supplies the state.
// the art-state object for a player — extracted so the hit flash can re-render
// the exact same figure into its scratch buffer
function wizardArt(p, x, y, scale, now, angle = 0) {
  const spell = p.spellId && SPELLS[p.spellId];
  const ready = spell && now - p.lastCast > spell.cooldown;
  return {
    x, y, scale, angle, now, name: p.name,
    color: p.color, hat: p.hat, hp: ((p.hp ?? MAX_HP) / MAX_HP) * 100,
    facing: p.facing, walkPhase: p.walkPhase, vx: p.body.velocity.x,
    piggy: now < (p.pigUntil || 0),
    alive: p.alive !== 0 && p.alive !== false,
    spellReady: ready, spellColor: ready ? spell.color : '#fff',
    variant: avatarVariant(p.name),
  };
}

function drawWizardFigure(p, x, y, scale, now, angle = 0) {
  drawStoryWizard(ctx, wizardArt(p, x, y, scale, now, angle));
}

// Nametags used to be drawn unconditionally at a fixed offset, so two wizards
// standing together rendered their tags on top of each other and the overlap
// read as one corrupted word ("BREWJESTER"). Tags now reserve a slot: each one
// checks the boxes already claimed this frame and steps up until it's clear.
// Reset every frame by resetNameTagSlots().
const _tagSlots = [];
function resetNameTagSlots() { _tagSlots.length = 0; }

function _claimTagSlot(x, y, halfW) {
  const STEP = 13, LIMIT = 5;
  let ty = y;
  for (let i = 0; i <= LIMIT; i++) {
    const clash = _tagSlots.some(s => Math.abs(s.y - ty) < STEP - 1 && Math.abs(s.x - x) < s.halfW + halfW + 4);
    if (!clash) break;
    ty -= STEP;
  }
  _tagSlots.push({ x, y: ty, halfW });
  return ty;
}

function drawNameTag(name, color, x, y) {
  const z = typeof CAM !== 'undefined' ? CAM.zoom : 1;
  ctx.save();
  // sized in screen px: a nametag that scales with the camera stops being a label
  ctx.font = `bold ${11 / z}px Georgia`;
  ctx.textAlign = 'center';
  const halfW = ctx.measureText(name).width / 2;
  const ty = _claimTagSlot(x, y, halfW);
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = 'rgba(10, 6, 16, 0.85)'; // halo so any color reads on any backdrop
  ctx.lineWidth = 3 / z;
  ctx.lineJoin = 'round';
  ctx.strokeText(name, x, ty);
  ctx.fillStyle = color;
  ctx.fillText(name, x, ty);
  // a tag pushed up off its owner gets a stem, so it stays attached to a wizard
  if (ty < y - 2) {
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1 / z;
    ctx.beginPath(); ctx.moveTo(x, ty + 3 / z); ctx.lineTo(x, y + 2 / z); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawWizard(p, now) {
  const { x, y } = p.body.position;
  const s = p.sizeScale || 1;
  drawNameTag(p.name, p.color, x, y - 48 * s);
  // mega-size wizards get a gold aura — additive so the bloom pass picks it up
  if (s > 1.6) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glowOrb(ctx, x, y - 6 * s, 34 * s, '#ffd700', 0.32);
    ctx.restore();
  }
  drawWizardFigure(p, x, y, s, now, p.body.angle * 0.35);
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
    // fades over the hitstop window rather than popping on/off
    const amt = Math.min(1, (p.hurtUntil - now) / 90);
    drawStoryHitFlash(ctx, wizardArt(p, x, y, s, now), amt * 0.95);
  }
  if (now < p.frozenUntil) drawStoryIceBlock(ctx, x, y - 7 * s, 34 * s, 50 * s, now);
  // no health bars — the hat tells the story (see drawWizardFigure)
}
