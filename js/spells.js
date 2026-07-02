// spells.js — spell registry, projectiles, explosions, timed effects
const projectiles = new Set();
const activeEffects = [];

function shoot(p, { r, speed, vy = 0, color, density = 0.002, restitution = 0.6, expireMs, gravityScale = 1 }) {
  const { x, y } = p.body.position;
  const fb = Bodies.circle(x + p.facing * 26, y - 6, r, {
    density, frictionAir: 0, restitution, label: 'projectile',
    collisionFilter: { group: p.group },
  });
  fb.owner = p;
  fb.color = color;
  fb.gravityScale = gravityScale;
  if (expireMs) fb.expireAt = performance.now() + expireMs;
  Body.setVelocity(fb, { x: p.facing * speed, y: vy });
  projectiles.add(fb);
  Composite.add(world, fb);
  return fb;
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
      damagePlayer(body.player, body.player === owner ? dmg * 0.5 : dmg);
    }
  }
  for (const c of Composite.allConstraints(currentMap.composite)) {
    if (c.label !== 'breakable') continue;
    const pos = (c.bodyA || c.bodyB).position;
    if (Math.hypot(pos.x - x, pos.y - y) < radius * 0.75) Composite.remove(currentMap.composite, c);
  }
}

function raycastHit(p) {
  const from = { x: p.body.position.x + p.facing * 20, y: p.body.position.y - 6 };
  const candidates = Composite.allBodies(world).filter(b =>
    b !== p.body && !b.isSensor && b.label !== 'gib' && b.label !== 'projectile');
  for (let d = 0; d < 1400; d += 10) {
    const pt = { x: from.x + p.facing * d, y: from.y };
    if (pt.x < -40 || pt.x > W + 40) break;
    const hit = Query.point(candidates, pt)[0];
    if (hit) return { hit, pt };
  }
  return { hit: null, pt: { x: from.x + p.facing * 1400, y: from.y } };
}

function spawnSingularity(x, y, m = 1) {
  sfx.blackhole();
  doFlash('#a55eea', 0.2);
  spawnRing(x, y, '#a55eea');
  activeEffects.push({
    until: performance.now() + 2200 * m,
    update() {
      const R = 350 * (1 + (m - 1) * 0.5);
      for (const b of Composite.allBodies(world)) {
        if (b.isStatic || b.isSensor) continue;
        const dx = x - b.position.x, dy = y - b.position.y;
        const d = Math.hypot(dx, dy);
        if (d > R || d === 0) continue;
        if (d < 30) {
          if (b.label === 'player') damagePlayer(b.player, 999);
          else {
            spawnParticles(b.position.x, b.position.y, '#a55eea', 6, 3);
            projectiles.delete(b); gibs.delete(b); tomes.delete(b); hats.delete(b);
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
      for (const b of Composite.allBodies(world)) {
        if (b.isStatic || b === p.body || b.isSensor) continue;
        const dx = b.position.x - x, dy = b.position.y - y;
        const d = Math.hypot(dx, dy);
        if (d > range || d === 0) continue;
        if (Math.sign(dx) !== p.facing && Math.abs(dx) > 20) continue;
        if (Math.abs(dy) > d * 0.6) continue;
        const s = 1 - d / range;
        if (b.label === 'projectile') {
          Body.setVelocity(b, { x: p.facing * Math.hypot(b.velocity.x, b.velocity.y), y: -2 });
          continue;
        }
        Body.setVelocity(b, { x: b.velocity.x + p.facing * 18 * m * s, y: b.velocity.y - 6 * m * s });
      }
      Body.setVelocity(p.body, { x: p.body.velocity.x - p.facing * 7, y: p.body.velocity.y - 2 });
      for (let i = 0; i < 14; i++) {
        particles.push({ kind: 'spark', x: x + p.facing * 20, y: y - 6 + rand(-14, 14), vx: p.facing * rand(6, 14), vy: rand(-1, 1), life: 18, maxLife: 18, color: '#d7f5ef', r: 2 });
      }
    },
  },
  lightning: {
    name: 'Lightning', color: '#fff89e', cooldown: 900,
    cast(p) {
      const { hit, pt } = raycastHit(p);
      sfx.lightning();
      doFlash('#ffffff', 0.35);
      slowMo(0.05, 70);
      addShake(6);
      const from = { x: p.body.position.x + p.facing * 14, y: p.body.position.y - 8 };
      const pts = [from];
      const segs = 9;
      for (let i = 1; i <= segs; i++) {
        pts.push({ x: from.x + (pt.x - from.x) * i / segs, y: from.y + (pt.y - from.y) * i / segs + (i < segs ? rand(-14, 14) : 0) });
      }
      const m = p.mega || 1;
      activeEffects.push({
        until: performance.now() + 130,
        draw() {
          ctx.strokeStyle = '#fff89e';
          ctx.lineWidth = 3 * m;
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (const q of pts.slice(1)) ctx.lineTo(q.x, q.y);
          ctx.stroke();
        },
      });
      spawnParticles(pt.x, pt.y, '#fff89e', 12, 6);
      if (hit && !hit.isStatic) {
        Body.setVelocity(hit, { x: hit.velocity.x + p.facing * 28 * m, y: hit.velocity.y - 10 * m });
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
        until: t0 + 1600,
        update(now) {
          while (spawned < times.length && now > times[spawned]) {
            spawned++;
            const rock = Bodies.circle(cx + rand(-260, 260), -50, 13, { density: 0.006, frictionAir: 0, label: 'projectile' });
            rock.color = '#ff8c5a';
            rock.owner = p;
            rock.onHit = () => explode(rock.position.x, rock.position.y, 90 * m, 14 * m, 28 * m, p);
            Body.setVelocity(rock, { x: rand(-2, 2), y: 18 });
            projectiles.add(rock);
            Composite.add(world, rock);
          }
        },
      });
    },
  },
};

function castSpell(p, now) {
  const spell = SPELLS[p.spellId];
  if (now - p.lastCast < spell.cooldown) return;
  p.lastCast = now;
  p.mega = p.megaCasts > 0 ? 1.7 : 1;
  sfx.cast();
  spell.cast(p);
  if (p.megaCasts > 0) {
    p.megaCasts--;
    spawnText(p.body.position.x, p.body.position.y - 60, `${p.megaCasts} LEFT`, '#ffd700');
    if (p.megaCasts === 0) setTimeout(() => unMega(p), 600);
  }
}

function removeProjectile(fb) {
  projectiles.delete(fb);
  Composite.remove(world, fb);
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
