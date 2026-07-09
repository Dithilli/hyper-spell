// spells.js — spell core: projectiles, explosions, summons, effects, casting
const projectiles = new Set();
const activeEffects = [];
const summons = new Set();

// unit direction a player is aiming: mouse/stick aim if present,
// else classic facing + lob elevation (vy), gravity-aware
function aimDir(p, speed = 20, vy = 0) {
  if (p.aimAngle != null) return { x: Math.cos(p.aimAngle), y: Math.sin(p.aimAngle) };
  const gdir = gravDirFor(p);
  const len = Math.hypot(speed, vy) || 1;
  return { x: p.facing * (speed / len), y: (vy * gdir) / len };
}

function shoot(p, { r, speed, vy = 0, color, density = 0.002, restitution = 0.6, expireMs, gravityScale = 1, angle }) {
  const { x, y } = p.body.position;
  const dir = angle != null ? { x: Math.cos(angle), y: Math.sin(angle) } : aimDir(p, speed, vy);
  const spd = Math.hypot(speed, vy);
  const fb = Bodies.circle(x + dir.x * 28, y - 6 + dir.y * 16, r, {
    density, frictionAir: 0, restitution, label: 'projectile',
    collisionFilter: { group: p.group },
  });
  fb.owner = p;
  fb.color = color;
  fb.gravityScale = gravityScale;
  if (expireMs) fb.expireAt = performance.now() + expireMs;
  Body.setVelocity(fb, { x: dir.x * spd, y: dir.y * spd });
  projectiles.add(fb);
  Composite.add(world, fb);
  return fb;
}

function dropProjectile(p, x, y, { r = 10, vx = 0, vy = 12, color, density = 0.004, expireMs = 6000 }) {
  if (engine.gravity.y < 0) { y = H - y; vy = -vy; } // "sky" is below when gravity flips
  const fb = Bodies.circle(x, y, r, { density, frictionAir: 0, label: 'projectile' });
  fb.owner = p;
  fb.color = color;
  fb.gravityScale = 1;
  fb.expireAt = performance.now() + expireMs;
  Body.setVelocity(fb, { x: vx, y: vy });
  projectiles.add(fb);
  Composite.add(world, fb);
  return fb;
}

function removeProjectile(fb) {
  projectiles.delete(fb);
  Composite.remove(world, fb);
}

function summon(body, { life = 5000, color, ...flags } = {}) {
  if (color) body.render.fillStyle = color;
  Object.assign(body, flags);
  body.dieAt = performance.now() + life;
  summons.add(body);
  Composite.add(world, body);
  return body;
}

function removeSummon(b) {
  if (!summons.has(b)) return;
  summons.delete(b);
  spawnParticles(b.position.x, b.position.y, b.render.fillStyle || '#e8d5ff', 6, 3, 20);
  Composite.remove(world, b);
}

function enemiesOf(p) {
  return players.filter(q => q.alive && q !== p);
}

function nearestEnemy(p, maxD = 1e9, from = p.body.position) {
  let best = null, bd = maxD;
  for (const q of enemiesOf(p)) {
    const d = Math.hypot(q.body.position.x - from.x, q.body.position.y - from.y);
    if (d < bd) { bd = d; best = q; }
  }
  return best;
}

function explode(x, y, radius = 150, power = 22, damage = 0, owner = null) {
  addShake(Math.min(14, power * 0.7));
  sfx.explosion();
  spawnRing(x, y, '#ffb347');
  spawnParticles(x, y, '#ffb347', 26, 9);
  spawnParticles(x, y, '#ff5e57', 18, 7);
  if (power >= 18) doFlash('#ffb347', 0.12);
  for (const body of Composite.allBodies(world)) {
    const dx = body.position.x - x, dy = body.position.y - y;
    const d = Math.hypot(dx, dy);
    if (d > radius || d === 0) continue;
    if (body.label === 'boss' && damage && owner !== 'boss') {
      damageBoss(damage * (1 - d / (radius * 1.15)) * 1.2, body.position, owner);
    }
    if (body.isStatic) {
      if (body.label === 'icicle') body._blast = true;
      continue;
    }
    const s = 1 - d / radius;
    Body.setVelocity(body, {
      x: body.velocity.x + (dx / d) * power * s,
      y: body.velocity.y + (dy / d) * power * s - 4 * s,
    });
    Body.setAngularVelocity(body, body.angularVelocity + (Math.random() - 0.5) * 0.4);
    if (body.label === 'player' && damage) {
      const dmg = damage * (1 - d / (radius * 1.15));
      damagePlayer(body.player, body.player === owner ? dmg * 0.5 : dmg, owner);
    }
  }
  for (const c of Composite.allConstraints(currentMap.composite)) {
    if (c.label !== 'breakable') continue;
    const pos = (c.bodyA || c.bodyB).position;
    if (Math.hypot(pos.x - x, pos.y - y) < radius * 0.75) Composite.remove(currentMap.composite, c);
  }
}

function raycastHit(p, angOff = 0) {
  let dir = aimDir(p, 1, 0);
  if (angOff) {
    const a = Math.atan2(dir.y, dir.x) + angOff;
    dir = { x: Math.cos(a), y: Math.sin(a) };
  }
  const from = { x: p.body.position.x + dir.x * 22, y: p.body.position.y - 6 + dir.y * 14 };
  const candidates = Composite.allBodies(world).filter(b =>
    b !== p.body && !b.isSensor && b.label !== 'gib' && b.label !== 'projectile' && b.collisionFilter.mask !== 0);
  for (let d = 0; d < 1400; d += 10) {
    const pt = { x: from.x + dir.x * d, y: from.y + dir.y * d };
    if (pt.x < -40 || pt.x > W + 40 || pt.y < -60 || pt.y > H + 40) break;
    const hit = Query.point(candidates, pt)[0];
    if (hit) return { hit, pt, from, dir };
  }
  return { hit: null, pt: { x: from.x + dir.x * 1400, y: from.y + dir.y * 1400 }, from, dir };
}

function boltVisual(x0, y0, x1, y1, color = '#fff89e', width = 3, life = 130) {
  const pts = [{ x: x0, y: y0 }];
  const segs = 9;
  for (let i = 1; i <= segs; i++) {
    pts.push({
      x: x0 + (x1 - x0) * i / segs + (i < segs ? rand(-14, 14) : 0),
      y: y0 + (y1 - y0) * i / segs + (i < segs ? rand(-14, 14) : 0),
    });
  }
  activeEffects.push({
    until: performance.now() + life,
    draw() {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (const q of pts.slice(1)) ctx.lineTo(q.x, q.y);
      ctx.stroke();
    },
  });
}

function groundYAt(x) {
  const candidates = Composite.allBodies(world).filter(b =>
    b.isStatic && !b.isSensor && b.collisionFilter.mask !== 0);
  for (let y = 0; y < H; y += 12) {
    if (Query.point(candidates, { x, y })[0]) return y;
  }
  return H - 30;
}

// lightning CONDUCTION synergy: a Wet target takes amplified damage and the bolt
// arcs on to the nearest other wizard. Used by the beam primitives (zapRay).
function zapHit(target, dmg, src) {
  const now = performance.now();
  if (now < (target.wetUntil || 0)) {
    dmg *= 1.6;
    spawnText(target.body.position.x, target.body.position.y - 46, 'CONDUCT!', '#9ef0f0');
    let best = null, bd = 300;
    for (const q of players) {
      if (!q.alive || q === target || q === src) continue;
      const d = Math.hypot(q.body.position.x - target.body.position.x, q.body.position.y - target.body.position.y);
      if (d < bd) { bd = d; best = q; }
    }
    if (best) {
      boltVisual(target.body.position.x, target.body.position.y, best.body.position.x, best.body.position.y, '#9ef0f0', 3, 120);
      damagePlayer(best, dmg * 0.45, src);
    }
  }
  damagePlayer(target, dmg, src);
}

function skyBolt(x, dmg, owner, m = 1) {
  const hitY = groundYAt(x);
  boltVisual(x, -20, x, hitY, '#fff89e', 3 * m);
  doFlash('#ffffff', 0.2);
  sfx.lightning();
  explode(x, hitY, 80 * m, 12 * m, dmg * m, owner);
}

function spawnSingularity(x, y, m = 1) {
  sfx.blackhole();
  doFlash('#a55eea', 0.2);
  spawnRing(x, y, '#a55eea');
  activeEffects.push({
    until: performance.now() + 2200 * m,
    net: { k: 'sing', x, y },
    update() {
      const R = 350 * (1 + (m - 1) * 0.5);
      for (const b of Composite.allBodies(world)) {
        if (b.isStatic || b.isSensor) continue;
        const dx = x - b.position.x, dy = y - b.position.y;
        const d = Math.hypot(dx, dy);
        if (d > R || d === 0) continue;
        if (d < 30) {
          if (b.label === 'player') damagePlayer(b.player, 999);
          else if (b.label !== 'boss') { // never consume the boss body — it would strand game.boss
            spawnParticles(b.position.x, b.position.y, '#a55eea', 6, 3);
            projectiles.delete(b); gibs.delete(b); tomes.delete(b); hats.delete(b); summons.delete(b);
            Composite.remove(world, b, true);
          }
          continue;
        }
        const s = 1 - d / R;
        const pull = 0.9 * s, tang = 0.35 * s;
        Body.setVelocity(b, {
          x: b.velocity.x + (dx / d) * pull + (-dy / d) * tang,
          y: b.velocity.y + (dy / d) * pull + (dx / d) * tang,
        });
      }
      for (const c of Composite.allConstraints(currentMap.composite)) {
        if (c.label !== 'breakable') continue;
        const pos = (c.bodyA || c.bodyB).position;
        if (Math.hypot(pos.x - x, pos.y - y) < 140) Composite.remove(currentMap.composite, c);
      }
      if (Math.random() < 0.6) {
        const a = rand(0, Math.PI * 2), dd = rand(60, 180);
        particles.push({ kind: 'square', x: x + Math.cos(a) * dd, y: y + Math.sin(a) * dd, vx: -Math.cos(a) * 4, vy: -Math.sin(a) * 4, life: 16, maxLife: 16, color: '#a55eea', r: 2.5 });
      }
    },
    draw(now) {
      ctx.fillStyle = '#0a0510';
      ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#a55eea';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(now * 0.02);
      ctx.beginPath(); ctx.arc(x, y, 36 + 5 * Math.sin(now * 0.011), 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    },
    onEnd() { explode(x, y, 160, 18, 25); },
  });
}

// circular zone effect: calls tick(player) for alive players inside, every frame
function makeZone({ x, y, r, life, color, tick, tickBody, draw, onEnd }) {
  activeEffects.push({
    until: performance.now() + life,
    x, y, r,
    net: { k: 'zone', x, y, r, c: color },
    update(now) {
      if (tick) {
        for (const q of players) {
          if (!q.alive) continue;
          if (Math.hypot(q.body.position.x - x, q.body.position.y - y) < r) tick(q, now);
        }
      }
      if (tickBody) {
        for (const b of Composite.allBodies(world)) {
          if (b.isStatic || b.isSensor) continue;
          if (Math.hypot(b.position.x - x, b.position.y - y) < r) tickBody(b, now);
        }
      }
    },
    draw(now) {
      if (draw) { draw(now); return; }
      ctx.globalAlpha = 0.16 + 0.06 * Math.sin(now * 0.01);
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    },
    onEnd,
  });
}

const SPELLS = {
  fireball: {
    name: 'Fireball', color: '#ffb347', cooldown: 450,
    cast(p) {
      const m = p.mega || 1;
      const fb = shoot(p, { r: 7 * m, speed: 20, vy: -6, color: '#ffb347', gravityScale: 0.45 });
      fb.onHit = () => explode(fb.position.x, fb.position.y, 150 * m, 22 * m, 35 * m, fb.owner);
      Body.setVelocity(p.body, { x: p.body.velocity.x - p.facing * 2, y: p.body.velocity.y });
    },
  },
  gust: {
    name: 'Gust', color: '#d7f5ef', cooldown: 700,
    cast(p) {
      const m = p.mega || 1;
      const range = 240 * m;
      const { x, y } = p.body.position;
      const dir = aimDir(p, 1, 0);
      for (const b of Composite.allBodies(world)) {
        if (b.isStatic || b === p.body || b.isSensor) continue;
        const dx = b.position.x - x, dy = b.position.y - y;
        const d = Math.hypot(dx, dy);
        if (d > range || d === 0) continue;
        if ((dx * dir.x + dy * dir.y) / d < 0.55) continue; // ~56° cone around aim
        const s = 1 - d / range;
        if (b.label === 'projectile') {
          const spd = Math.hypot(b.velocity.x, b.velocity.y);
          Body.setVelocity(b, { x: dir.x * spd, y: dir.y * spd });
          continue;
        }
        Body.setVelocity(b, { x: b.velocity.x + dir.x * 18 * m * s, y: b.velocity.y + dir.y * 18 * m * s - 3 * s });
      }
      Body.setVelocity(p.body, { x: p.body.velocity.x - dir.x * 7, y: p.body.velocity.y - dir.y * 4 - 2 });
      for (let i = 0; i < 14; i++) {
        particles.push({ kind: 'spark', x: x + dir.x * 20, y: y - 6 + dir.y * 20 + rand(-10, 10), vx: dir.x * rand(6, 14), vy: dir.y * rand(6, 14) + rand(-1, 1), life: 18, maxLife: 18, color: '#d7f5ef', r: 2 });
      }
    },
  },
  lightning: {
    name: 'Lightning', color: '#fff89e', cooldown: 900,
    cast(p) {
      const m = p.mega || 1;
      const { hit, pt, from, dir } = raycastHit(p);
      sfx.lightning();
      doFlash('#ffffff', 0.35);
      slowMo(0.05, 70);
      addShake(6);
      boltVisual(from.x, from.y, pt.x, pt.y, '#fff89e', 3 * m);
      spawnParticles(pt.x, pt.y, '#fff89e', 12, 6);
      if (hit && !hit.isStatic) {
        Body.setVelocity(hit, { x: hit.velocity.x + dir.x * 28 * m, y: hit.velocity.y + dir.y * 28 * m - 8 * m });
        if (hit.label === 'player') damagePlayer(hit.player, 50 * m);
      }
    },
  },
  frost: {
    name: 'Frost', color: '#9be7ff', cooldown: 1100,
    cast(p) {
      const m = p.mega || 1;
      const fb = shoot(p, { r: 6 * m, speed: 17, vy: -4, color: '#9be7ff', gravityScale: 0.5 });
      fb.onHit = (self, other) => {
        spawnParticles(self.position.x, self.position.y, '#9be7ff', 10, 4);
        if (other && other.label === 'player' && other.player.alive) {
          damagePlayer(other.player, 15 * m);
          other.player.frozenUntil = performance.now() + 1500 * m;
          other.frictionAir = 0.001;
          sfx.freeze();
        }
      };
    },
  },
  blackhole: {
    name: 'Black Hole', color: '#a55eea', cooldown: 4000,
    cast(p) {
      const m = p.mega || 1;
      const fb = shoot(p, { r: 10 * m, speed: 9, vy: -2, color: '#a55eea', restitution: 0.2, expireMs: 1600, gravityScale: 0.4 });
      fb.onHit = () => spawnSingularity(fb.position.x, fb.position.y, m);
    },
  },
  meteor: {
    name: 'Meteor Storm', color: '#ff8c5a', cooldown: 5000,
    cast(p) {
      const m = p.mega || 1;
      const cx = Math.max(120, Math.min(W - 120, p.body.position.x + p.facing * 300));
      const t0 = performance.now();
      const times = Array.from({ length: Math.round(7 * m) }, (_, i) => t0 + i * 170 + rand(0, 80));
      let spawned = 0;
      activeEffects.push({
        until: t0 + 1600 + (times.length - 7) * 170,
        update(now) {
          while (spawned < times.length && now > times[spawned]) {
            spawned++;
            const rock = dropProjectile(p, cx + rand(-260, 260), -50, { r: 13, vy: 18, vx: rand(-2, 2), color: '#ff8c5a', density: 0.006 });
            rock.onHit = () => explode(rock.position.x, rock.position.y, 90 * m, 14 * m, 28 * m, p);
          }
        },
      });
    },
  },
};

// no spell fires faster than this, no matter how low its own cooldown — turns the
// spammy bolts (ember/zap/ice shard/...) into deliberate, aimed shots. Tune to
// taste: higher = more measured, lower = twitchier.
const CAST_FLOOR = 480;

function castSpell(p, now, slot = 0) {
  const id = p.slots[slot];
  const spell = id && SPELLS[id];
  if (!spell) return;
  if (now - p.casts[slot] < Math.max(spell.cooldown, CAST_FLOOR)) return;
  p.casts[slot] = now;
  p.lastCastSlot = slot; // primary slot for spellId/lastCast accessors + attribution
  telCast(id); // balance: a confirmed cast (past the cooldown gate)
  // HYPERSPELL proc: chance scales with cooldown so spam doesn't farm rolls —
  // ~1.2% per second of cooldown, capped at 6% (rare enough to stay special)
  const hyper = Math.random() < Math.min(0.06, spell.cooldown * 0.000012);
  p.mega = (p.megaCasts > 0 ? 1.7 : 1) * (hyper ? 2.2 : 1);
  if (hyper) {
    statFor(p).procs++;
    setBanner('✦ HYPERSPELL ✦', '#e8d5ff', 1100, true);
    doFlash('#a55eea', 0.4);
    slowMo(0.25, 380);
    addShake(10);
    spawnRing(p.body.position.x, p.body.position.y, '#a55eea');
    sfx.hyper();
  }
  sfx.cast();
  spell.cast(p);
  // combo (hybrid) spells get a brief hitstop so you notice the big moment
  if (spell.hybrid && !hyper) { slowMo(0.28, 150); addShake(5); }
  if (p.megaCasts > 0) {
    p.megaCasts--;
    spawnText(p.body.position.x, p.body.position.y - 60, `${p.megaCasts} LEFT`, '#ffd700');
    if (p.megaCasts === 0) p.megaUntil = now + 600;
  }
}

function updateEffects(now, dt) {
  for (let i = activeEffects.length - 1; i >= 0; i--) {
    const e = activeEffects[i];
    e.update?.(now, dt);
    if (now > e.until) {
      e.onEnd?.();
      activeEffects.splice(i, 1);
    }
  }
}
