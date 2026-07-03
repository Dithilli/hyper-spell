// boss.js — every 25th round (session-wide) the wizards fight a boss together.
// Slay it and the match continues as normal; a full party wipe resets every
// wizard's round wins to zero. Physics is host-side; the boss body rides the
// summons ghost path to LAN clients, its HP bar via the snapshot's `bs` field.
const BOSS_EVERY = 25;

function bossAliveTarget(from) {
  const alive = players.filter(p => p.alive);
  if (!alive.length) return null;
  if (!from) return pick(alive);
  return alive.reduce((a, b) =>
    Math.hypot(a.body.position.x - from.x, a.body.position.y - from.y) <
    Math.hypot(b.body.position.x - from.x, b.body.position.y - from.y) ? a : b);
}

// a projectile the boss spits at a target
function bossBolt(from, target, { speed = 10, r = 8, color, spread = 0, boom = [60, 9, 11] }) {
  const t = target.body.position;
  const a = Math.atan2(t.y - from.y, t.x - from.x) + spread;
  const off = (game.boss?.body.circleRadius || 40) + r + 14; // clear the boss's own hitbox
  const fb = Bodies.circle(from.x + Math.cos(a) * off, from.y + Math.sin(a) * off, r, { density: 0.004, frictionAir: 0, label: 'projectile' });
  fb.owner = null;
  fb.color = color;
  fb.gravityScale = 0.25;
  fb.expireAt = performance.now() + 5000;
  fb.onHit = self => explode(self.position.x, self.position.y, boom[0], boom[1], boom[2], 'boss');
  Body.setVelocity(fb, { x: Math.cos(a) * speed, y: Math.sin(a) * speed });
  projectiles.add(fb);
  Composite.add(world, fb);
  return fb;
}

// hurt wizards who press against the boss's body
function bossTouchAll(bs, now, dmg, pad = 8) {
  const bb = bs.body.bounds;
  for (const p of players) {
    if (!p.alive || now < (p._bossHurtAt || 0)) continue;
    const q = p.body.position;
    if (q.x > bb.min.x - pad && q.x < bb.max.x + pad && q.y > bb.min.y - pad && q.y < bb.max.y + pad) {
      p._bossHurtAt = now + 700;
      damagePlayer(p, dmg);
      const away = Math.sign(q.x - bs.body.position.x) || pick([-1, 1]);
      Body.setVelocity(p.body, { x: away * 8, y: -6 });
    }
  }
}

const BOSSES = [
  {
    id: 'dragon', name: 'THE DRAGON', color: '#e15d5d',
    make() {
      return Bodies.circle(W / 2, 140, 42, { density: 0.012, frictionAir: 0.06, label: 'boss' });
    },
    update(bs, now) {
      const b = bs.body;
      Body.applyForce(b, b.position, { x: 0, y: -engine.gravity.y * engine.gravity.scale * b.mass }); // it flies
      if (!bs.wp || Math.hypot(bs.wp.x - b.position.x, bs.wp.y - b.position.y) < 70) {
        bs.wp = { x: rand(150, W - 150), y: rand(90, 320) };
      }
      const dx = bs.wp.x - b.position.x, dy = bs.wp.y - b.position.y, d = Math.hypot(dx, dy) || 1;
      Body.setVelocity(b, { x: b.velocity.x * 0.92 + (dx / d) * 1.1, y: b.velocity.y * 0.92 + (dy / d) * 1.1 });
      if (now > (bs.nextSpit || (bs.nextSpit = now + 1800))) {
        bs.nextSpit = now + rand(2300, 3300);
        const t = bossAliveTarget(b.position);
        if (t) {
          for (const off of [-0.18, 0, 0.18]) bossBolt(b.position, t, { speed: 9.5, r: 9, color: '#ff8c5a', spread: off });
          sfx.cast();
        }
      }
      if (now > (bs.nextVolley || (bs.nextVolley = now + 7000))) {
        bs.nextVolley = now + rand(8500, 12000);
        for (let i = 0; i < 4; i++) {
          const fb = dropProjectile(null, rand(80, W - 80), -30, { r: 10, vx: rand(-2, 2), vy: 9, color: '#ff8c5a', density: 0.006, expireMs: 9000 });
          fb.onHit = self => explode(self.position.x, self.position.y, 85, 13, 13, 'boss');
        }
      }
      bossTouchAll(bs, now, 10);
    },
  },
  {
    id: 'lich', name: 'THE LICH', color: '#c084fc',
    make() {
      return Bodies.circle(W / 2, 160, 30, { density: 0.01, frictionAir: 0.12, label: 'boss' });
    },
    update(bs, now) {
      const b = bs.body;
      Body.applyForce(b, b.position, { x: 0, y: -engine.gravity.y * engine.gravity.scale * b.mass });
      Body.setVelocity(b, { x: b.velocity.x * 0.9, y: b.velocity.y * 0.9 + Math.sin(now * 0.003) * 0.25 });
      if (now > (bs.nextBlink || (bs.nextBlink = now + 3000))) {
        bs.nextBlink = now + rand(3200, 4400);
        spawnParticles(b.position.x, b.position.y, '#c084fc', 16, 5);
        Body.setPosition(b, { x: rand(140, W - 140), y: rand(100, 340) });
        spawnParticles(b.position.x, b.position.y, '#c084fc', 16, 5);
        sfx.freeze();
      }
      if (now > (bs.nextBolt || (bs.nextBolt = now + 2200))) {
        bs.nextBolt = now + rand(1700, 2500);
        const t = bossAliveTarget(null); // torments a random wizard, not the closest
        if (t) { bossBolt(b.position, t, { speed: 11, r: 7, color: '#c084fc', boom: [55, 8, 10] }); sfx.cast(); }
      }
      if (now > (bs.nextRaise || (bs.nextRaise = now + 7000))) {
        bs.nextRaise = now + rand(8000, 11000);
        for (const side of [-1, 1]) {
          const sk = Bodies.circle(b.position.x + side * 30, b.position.y + 20, 9, { density: 0.002, friction: 0.5, restitution: 0.4, label: 'critter' });
          sk.critter = { hopAt: 0, dir: side, hop: 6, speed: 4 };
          summon(sk, { life: 16000, color: '#e8e8dc', contactDamage: 6 });
        }
        spawnText(b.position.x, b.position.y - 50, 'RISE!', '#c084fc');
      }
      bossTouchAll(bs, now, 8);
    },
  },
  {
    id: 'golem', name: 'THE GOLEM', color: '#b08948',
    make() {
      return Bodies.rectangle(W / 2, 60, 74, 92, { density: 0.02, friction: 0.8, restitution: 0, label: 'boss' });
    },
    update(bs, now) {
      const b = bs.body;
      Body.setAngle(b, b.angle * 0.8);
      Body.setAngularVelocity(b, 0);
      if (b.position.y > H - 20) { // climbed out of the pit it fell into
        Body.setPosition(b, { x: W / 2, y: 40 });
        Body.setVelocity(b, { x: 0, y: 0 });
        addShake(6);
      }
      const t = bossAliveTarget(b.position);
      if (t && !bs.airborne) {
        const dir = Math.sign(t.body.position.x - b.position.x);
        Body.setVelocity(b, { x: b.velocity.x * 0.8 + dir * 0.9, y: b.velocity.y });
      }
      if (t && now > (bs.nextLeap || (bs.nextLeap = now + 3500)) && Math.abs(b.velocity.y) < 1) {
        bs.nextLeap = now + rand(4500, 6500);
        bs.airborne = true;
        const dir = Math.sign(t.body.position.x - b.position.x) || 1;
        Body.setVelocity(b, { x: dir * rand(6, 10), y: -16 });
        sfx.boing();
      }
      if (bs.airborne && b.velocity.y >= 0 && Math.abs(b.velocity.y) < 0.8) {
        bs.airborne = false;
        explode(b.position.x, b.position.y + 30, 140, 20, 16, 'boss');
        addShake(14);
      }
      bossTouchAll(bs, now, 12);
    },
  },
  {
    id: 'kraken', name: 'THE KRAKEN', color: '#3d6a8a',
    make() {
      return Bodies.circle(W / 2, H - 95, 42, { isStatic: true, label: 'boss' });
    },
    update(bs, now) {
      const b = bs.body;
      Body.setPosition(b, { x: W / 2 + Math.sin(now / 3200) * 200, y: H - 95 + Math.sin(now / 900) * 12 });
      // tentacle strikes: warn at a wizard's feet, then a pillar erupts
      bs.pending ??= [];
      bs.tentacles ??= [];
      if (now > (bs.nextTent || (bs.nextTent = now + 2500))) {
        bs.nextTent = now + rand(2600, 3800);
        const t = bossAliveTarget(null);
        if (t) bs.pending.push({ x: t.body.position.x, at: now + 650 });
      }
      for (const w of bs.pending) {
        if (Math.random() < 0.5) spawnParticles(w.x + rand(-12, 12), H - 30, '#3d6a8a', 1, 2, 14);
        if (now > w.at) {
          const tb = Bodies.rectangle(w.x, H + 120, 26, 240, { isStatic: true, label: 'tentacle' });
          summon(tb, { life: 3000, color: '#3d6a8a' });
          bs.tentacles.push({ b: tb, t0: now, x: w.x, hit: new Set() });
          sfx.squeak();
        }
      }
      bs.pending = bs.pending.filter(w => now <= w.at);
      for (const tn of [...bs.tentacles]) {
        const age = now - tn.t0;
        const rise = age < 450 ? age / 450 : age < 1400 ? 1 : Math.max(0, 1 - (age - 1400) / 700);
        Body.setPosition(tn.b, { x: tn.x, y: H + 120 - rise * 260 });
        for (const p of players) {
          if (!p.alive || tn.hit.has(p)) continue;
          const q = p.body.position;
          if (Math.abs(q.x - tn.x) < 26 && q.y > tn.b.bounds.min.y - 12) {
            tn.hit.add(p);
            damagePlayer(p, 14);
            Body.setVelocity(p.body, { x: Math.sign(q.x - tn.x || 1) * 7, y: -13 });
          }
        }
        if (age > 2100) { removeSummon(tn.b); bs.tentacles.splice(bs.tentacles.indexOf(tn), 1); }
      }
      bossTouchAll(bs, now, 10);
    },
  },
];

function isBossRound() {
  return !!game.boss;
}

function spawnBoss(now) {
  const def = pick(BOSSES);
  const body = def.make();
  body.bossType = def.id;
  summon(body, { life: 1e12, color: def.color });
  const maxHp = 400 + 200 * Math.max(2, players.length);
  game.boss = { def, body, hp: maxHp, maxHp, announced: false };
}

function damageBoss(dmg, at) {
  const bs = game.boss;
  if (!bs || game.state !== 'PLAY' || !bs.announced || bs.hp <= 0) return;
  bs.hp -= dmg;
  bs.hurtAt = performance.now();
  if (at) spawnParticles(at.x, at.y, bs.def.color, 8, 4);
  if (bs.hp <= 0) slayBoss();
}

function slayBoss() {
  const bs = game.boss;
  const pos = { ...bs.body.position };
  removeSummon(bs.body);
  for (const tn of bs.tentacles || []) removeSummon(tn.b);
  game.boss = null;
  explode(pos.x, pos.y, 220, 26, 0, 'boss');
  spawnParticles(pos.x, pos.y, bs.def.color, 40, 10, 70);
  spawnRing(pos.x, pos.y, '#ffd166');
  game.state = 'ROUND_END';
  game.winner = null;
  const replayMs = startReplay(performance.now());
  setBanner(`${bs.def.name} IS SLAIN!`, '#ffd166', 1800 + replayMs);
  sfx.victory();
  slowMo(0.25, 1100);
  setTimeout(() => {
    if (game.state === 'ROUND_END') startRound(nextMapIndex());
  }, 1900 + replayMs);
}

function updateBoss(now, dt) {
  const bs = game.boss;
  if (!bs || game.state !== 'PLAY') return;
  if (!bs.announced) {
    if (now > (game.fightAt || 0) + 800) {
      bs.announced = true;
      setBanner(`${bs.def.name} AWAKENS`, bs.def.color, 2200);
      doFlash(bs.def.color, 0.25);
      addShake(10);
      sfx.boss();
    }
    return;
  }
  bs.def.update(bs, now, dt);
}

// drawn via drawDynamicBody (live, LAN ghosts, and the killcam use the same path)
function drawBossBody(b, now) {
  const { x, y } = b.position;
  const type = b.bossType;
  const r = b.circleRadius || 46;
  if (type === 'dragon') {
    const flap = Math.sin(now * 0.012) * 0.5;
    ctx.fillStyle = '#a13d3d';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + side * r * 0.4, y - 8);
      ctx.lineTo(x + side * (r + 46), y - 30 - flap * 26);
      ctx.lineTo(x + side * (r + 14), y + 16);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#e15d5d';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a13d3d';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + side * 14, y - r + 6);
      ctx.lineTo(x + side * 24, y - r - 18);
      ctx.lineTo(x + side * 30, y - r + 12);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(x - 14, y - 10, 5, 0, Math.PI * 2); ctx.arc(x + 14, y - 10, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#16121c';
    ctx.beginPath(); ctx.arc(x - 14, y - 10, 2, 0, Math.PI * 2); ctx.arc(x + 14, y - 10, 2, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'lich') {
    ctx.fillStyle = '#2a1d3d';
    ctx.beginPath(); ctx.arc(x, y, r + 6, Math.PI, 0); ctx.fill(); // hood
    ctx.fillStyle = '#c084fc';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd166'; // crown
    ctx.beginPath();
    ctx.moveTo(x - 18, y - r - 2);
    for (let i = 0; i < 3; i++) { ctx.lineTo(x - 12 + i * 12, y - r - 16); ctx.lineTo(x - 6 + i * 12, y - r - 2); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#9be15d';
    ctx.beginPath(); ctx.arc(x - 10, y - 4, 4.5, 0, Math.PI * 2); ctx.arc(x + 10, y - 4, 4.5, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'golem') {
    drawBodyRounded(b, '#b08948');
    ctx.strokeStyle = 'rgba(90,66,30,0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - 20, y - 30); ctx.lineTo(x - 6, y - 10); ctx.lineTo(x - 16, y + 14);
    ctx.moveTo(x + 22, y - 20); ctx.lineTo(x + 10, y + 4);
    ctx.stroke();
    ctx.fillStyle = '#ff8c5a';
    ctx.beginPath(); ctx.arc(x - 13, y - 26, 5, 0, Math.PI * 2); ctx.arc(x + 13, y - 26, 5, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'kraken') {
    ctx.fillStyle = '#3d6a8a';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    for (const side of [-1, 1]) { // little idle tentacle stubs
      ctx.strokeStyle = '#3d6a8a';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(x + side * r * 0.7, y + r * 0.5);
      ctx.quadraticCurveTo(x + side * (r + 24), y + r * 0.2 + Math.sin(now * 0.004 + side) * 10, x + side * (r + 34), y + r);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x - 15, y - 8, 8, 0, Math.PI * 2); ctx.arc(x + 15, y - 8, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#16121c';
    ctx.beginPath(); ctx.arc(x - 15, y - 8, 3.5, 0, Math.PI * 2); ctx.arc(x + 15, y - 8, 3.5, 0, Math.PI * 2); ctx.fill();
  } else {
    drawBodyRounded(b, b.color || '#e15d5d');
  }
}

// shared HP bar (host HUD draws from game.boss; the net client from snap.bs)
function drawBossBar(name, color, hp, maxHp) {
  const w = 420, x = W / 2 - w / 2, y = 96;
  ctx.textAlign = 'center';
  ctx.font = 'bold 15px Georgia';
  ctx.fillStyle = color;
  ctx.fillText(name, W / 2, y - 6);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x, y, w, 10);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, hp / maxHp), 10);
  ctx.strokeStyle = '#e8d5ff';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, 10);
}
