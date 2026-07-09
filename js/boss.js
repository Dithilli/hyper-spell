// boss.js — every 10th round (session-wide) the wizards fight a boss together.
// Slay it and the match continues as normal; a full party wipe resets every
// wizard's round wins to zero. Physics is host-side; the boss body rides the
// summons ghost path to LAN clients, its HP bar via the snapshot's `bs` field.
const BOSS_EVERY = 10;

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
  const dm = game.boss?.dmgMult || 1; // later/enraged bosses hit harder
  fb.onHit = self => explode(self.position.x, self.position.y, boom[0], boom[1], boom[2] * dm, 'boss');
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
      damagePlayer(p, dmg * (bs.dmgMult || 1));
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

// SECRET BOSSES — rare, never in the normal rotation. Each has TWO modes that it
// flips between; the mode is encoded into body.bossType so it rides the snapshot
// to LAN clients (which draw whatever mode the host is in — no desync).
const SECRET_BOSSES = [
  {
    // Conor, CEO — "THE RIZARD" (his favourite joke). Flips Rizzard <-> Tizzard.
    id: 'rizard', name: 'THE RIZARD', color: '#ffd166', secret: true,
    make() { return Bodies.circle(W / 2, 150, 34, { density: 0.011, frictionAir: 0.1, label: 'boss' }); },
    update(bs, now) {
      const b = bs.body;
      Body.applyForce(b, b.position, { x: 0, y: -engine.gravity.y * engine.gravity.scale * b.mass });
      const rizz = Math.floor(now / 7000) % 2 === 0;
      b.bossType = rizz ? 'rizard_rizz' : 'rizard_tizz';
      if (bs.lastMode !== b.bossType) {
        bs.lastMode = b.bossType;
        if (rizz) { setBanner('😎 RIZZARD MODE', '#ffd166', 1300); doFlash('#ffd166', 0.2); }
        else { setBanner('🎯 TIZZARD MODE — LOCKED IN', '#3fb5ff', 1400, true); doFlash('#3fb5ff', 0.28); }
      }
      if (rizz) {
        // smooth operator: glides around, charms wizards (reverses their controls) and reels them in
        if (!bs.wp || Math.hypot(bs.wp.x - b.position.x, bs.wp.y - b.position.y) < 60) bs.wp = { x: rand(180, W - 180), y: rand(90, 300) };
        const dx = bs.wp.x - b.position.x, dy = bs.wp.y - b.position.y, d = Math.hypot(dx, dy) || 1;
        Body.setVelocity(b, { x: b.velocity.x * 0.9 + (dx / d) * 1.0, y: b.velocity.y * 0.9 + (dy / d) * 1.0 });
        if (now > (bs.nextCharm || (bs.nextCharm = now + 3200))) {
          bs.nextCharm = now + rand(3600, 5000);
          spawnRing(b.position.x, b.position.y, '#ff9ecb');
          setBanner(pick(['W RIZZ', 'UNMATCHED RIZZ', "IT'S GIVING UNICORN", 'HAVE YOU SEEN OUR SERIES A?', 'LET ME PITCH YOU']), '#ffd166', 1100);
          for (const p of players) {
            if (!p.alive) continue;
            if (Math.hypot(p.body.position.x - b.position.x, p.body.position.y - b.position.y) < 440) {
              p.reversedUntil = now + 2600;
              const pull = Math.sign(b.position.x - p.body.position.x) || 1;
              Body.setVelocity(p.body, { x: p.body.velocity.x + pull * 5, y: -4 });
              spawnBurst(p.body.position.x, p.body.position.y - 10, '#ff9ecb', 8, { speed: 4, up: 3, g: -0.03 });
            }
          }
          sfx.cast();
        }
        if (now > (bs.nextDeal || (bs.nextDeal = now + 2200))) {
          bs.nextDeal = now + rand(2000, 2800);
          const t = bossAliveTarget(b.position);
          if (t) { for (const off of [-0.14, 0.14]) bossBolt(b.position, t, { speed: 10, r: 8, color: '#ff9ecb', spread: off, boom: [70, 9, 12] }); sfx.cast(); }
        }
      } else {
        // TIZZARD: hyperfocus & pattern mastery. Conor is autistic and proud, and
        // "the Tizzard" is his own name for it — so this mode is his SUPERPOWER:
        // calm, deliberate, and devastatingly precise. He glides to a commanding
        // vantage point, locks on, leads his shots perfectly, and reads the board.
        if (!bs.focusPt || Math.hypot(bs.focusPt.x - b.position.x, bs.focusPt.y - b.position.y) < 40) {
          bs.focusPt = { x: rand(240, W - 240), y: rand(110, 240) };
        }
        const fdx = bs.focusPt.x - b.position.x, fdy = bs.focusPt.y - b.position.y, fd = Math.hypot(fdx, fdy) || 1;
        Body.setVelocity(b, { x: b.velocity.x * 0.85 + (fdx / fd) * 0.9, y: b.velocity.y * 0.85 + (fdy / fd) * 0.9 });
        // perfectly-led tracking shots — aims where you'll be, not where you are
        if (now > (bs.nextTrack || (bs.nextTrack = now + 850))) {
          bs.nextTrack = now + rand(800, 1100);
          const t = bossAliveTarget(b.position);
          if (t) {
            const lead = { body: { position: { x: t.body.position.x + (t.body.velocity.x || 0) * 8, y: t.body.position.y + (t.body.velocity.y || 0) * 8 } } };
            bossBolt(b.position, lead, { speed: 15, r: 7, color: '#3fb5ff', boom: [55, 8, 13] });
            if (Math.random() < 0.3) setBanner(pick(['LOCKED IN', 'PATTERN RECOGNIZED', 'HYPERFOCUS', 'I SEE THE WHOLE BOARD', 'THE TIZZARD SEES ALL', 'EVERY. DETAIL.']), '#3fb5ff', 1000);
          }
          sfx.cast();
        }
        // a flawless, evenly-spaced pattern volley — mastery made visible
        if (now > (bs.nextPattern || (bs.nextPattern = now + 3400))) {
          bs.nextPattern = now + rand(3600, 4800);
          const t = bossAliveTarget(b.position);
          if (t) {
            spawnRing(b.position.x, b.position.y, '#3fb5ff');
            for (const off of [-0.36, -0.24, -0.12, 0, 0.12, 0.24, 0.36]) bossBolt(b.position, t, { speed: 12, r: 6, color: '#7fd0ff', spread: off, boom: [48, 7, 10] });
          }
          sfx.lightning();
        }
      }
      bossTouchAll(bs, now, rizz ? 10 : 12);
    },
  },
  {
    // Manu, CTO — lives between Germany and Mexico. Flips German <-> Mexican mode.
    id: 'manu', name: 'MANU', color: '#b39ddb', secret: true,
    make() { return Bodies.circle(W / 2, 150, 32, { density: 0.011, frictionAir: 0.1, label: 'boss' }); },
    update(bs, now) {
      const b = bs.body;
      Body.applyForce(b, b.position, { x: 0, y: -engine.gravity.y * engine.gravity.scale * b.mass });
      const de = Math.floor(now / 7000) % 2 === 0;
      b.bossType = de ? 'manu_de' : 'manu_mx';
      if (bs.lastMode !== b.bossType) {
        bs.lastMode = b.bossType;
        if (de) { setBanner('🇩🇪 ORDNUNG MUSS SEIN', '#d0d0d8', 1300); doFlash('#c0c0d0', 0.2); }
        else { setBanner('🇲🇽 ¡ÓRALE!', '#6cbf5b', 1300); doFlash('#e15d5d', 0.2); }
      }
      Body.setVelocity(b, { x: b.velocity.x * 0.92 + Math.sin(now * 0.001) * 0.8, y: b.velocity.y * 0.9 + Math.sin(now * 0.003) * 0.3 });
      if (b.position.y < 90) Body.setVelocity(b, { x: b.velocity.x, y: 1.5 });
      if (b.position.y > 340) Body.setVelocity(b, { x: b.velocity.x, y: -1.5 });
      if (de) {
        // German: precise, punctual bolts + the occasional efficient freeze
        if (now > (bs.nextDe || (bs.nextDe = now + 1500))) {
          bs.nextDe = now + 1500;
          const t = bossAliveTarget(b.position);
          if (t) bossBolt(b.position, t, { speed: 13, r: 7, color: '#9ec9ff', boom: [55, 8, 12] });
          if (Math.random() < 0.4) { const q = bossAliveTarget(null); if (q) { q.frozenUntil = now + 700; q.body.frictionAir = 0.001; } }
          sfx.freeze();
        }
      } else {
        // Mexican: spicy chili fireballs (burn) + fiesta particles
        if (now > (bs.nextMx || (bs.nextMx = now + 1100))) {
          bs.nextMx = now + rand(850, 1400);
          const t = bossAliveTarget(b.position);
          if (t) for (const off of [-0.18, 0.08]) bossBolt(b.position, t, { speed: 10, r: 8, color: '#ff7043', spread: off, boom: [70, 9, 12] });
          for (const p of players) if (p.alive && Math.hypot(p.body.position.x - b.position.x, p.body.position.y - b.position.y) < 220) p.burnUntil = now + 1600;
          if (Math.random() < 0.3) spawnParticles(b.position.x, b.position.y, pick(['#6cbf5b', '#e15d5d', '#ffd166']), 10, 5);
          sfx.cast();
        }
      }
      bossTouchAll(bs, now, de ? 9 : 12);
    },
  },
];

function isBossRound() {
  return !!game.boss;
}

const BOSS_ROMAN = ['', '', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

function spawnBoss(now) {
  // ~12% of boss rounds summon a rare SECRET boss instead of a regular one
  const secret = Math.random() < 0.12;
  const def = secret ? pick(SECRET_BOSSES) : pick(BOSSES);
  const body = def.make();
  body.bossType = def.id;
  summon(body, { life: 1e12, color: def.color });
  // scale by which boss this is in the session (round 10 = #1, round 20 = #2, ...)
  // so round 30/40 fights are meaningfully nastier than the first.
  const num = Math.max(1, Math.round((game.totalRounds || BOSS_EVERY) / BOSS_EVERY));
  const maxHp = Math.round((400 + 200 * Math.max(2, players.length)) * (1 + 0.4 * (num - 1)));
  const title = def.name + (num > 1 ? ' ' + (BOSS_ROMAN[num] || `×${num}`) : '');
  game.boss = {
    def, body, hp: maxHp, maxHp, announced: false, secret,
    num, dmgMult: 1 + 0.12 * (num - 1), title,
    enraged: false, enrageAt: 0, nextEnrageWave: 0,
  };
}

function damageBoss(dmg, at, src) {
  const bs = game.boss;
  if (!bs || game.state !== 'PLAY' || !bs.announced || bs.hp <= 0) return;
  if (src && src.slot !== undefined) statFor(src).bossDmg += dmg;
  if (src && src.spellId) telBossDmg(src.spellId, dmg); // balance: boss damage per spell
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
  setBanner(bs.secret ? `${bs.def.name} RAGE-QUITS` : `${bs.def.name} IS SLAIN!`, '#ffd166', 1800 + replayMs);
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
      if (bs.secret) {
        setBanner(`❓ SECRET BOSS ❓  ${bs.title}`, bs.def.color, 2800, true);
        doFlash(bs.def.color, 0.45); addShake(16);
      } else {
        setBanner(`${bs.title} AWAKENS`, bs.def.color, 2200);
        doFlash(bs.def.color, 0.25); addShake(10);
      }
      sfx.boss();
      // later bosses run out of patience sooner; floor keeps it fair
      bs.enrageAt = now + Math.max(20000, 38000 - (bs.num - 1) * 4000);
    }
    return;
  }
  bs.def.update(bs, now, dt);

  // enrage: stalling a boss stops being a strategy. Fires once, then the arena
  // takes periodic shockwaves regardless of which boss it is (no per-boss edits).
  if (!bs.enraged && bs.enrageAt && now > bs.enrageAt) {
    bs.enraged = true;
    bs.dmgMult *= 1.6;
    bs.title += ' — ENRAGED';
    setBanner(`${bs.def.name} IS ENRAGED!`, '#ff4d4d', 2000);
    doFlash('#ff4d4d', 0.35);
    addShake(14);
    sfx.boss();
    bs.nextEnrageWave = now + 1600;
  }
  if (bs.enraged && now > bs.nextEnrageWave) {
    bs.nextEnrageWave = now + 1500;
    const { x, y } = bs.body.position;
    explode(x, y, 210, 12, 14 * bs.dmgMult, 'boss');
    spawnRing(x, y, '#ff4d4d');
    addShake(8);
  }
}

// storybook-styled orb + glowing eyes (mirrors artkit's drawStoryBoss look) so the
// bespoke team bosses live in the same illustrated world as the canonical ones.
function bossOrb(x, y, r, fill) {
  glowOrb(ctx, x, y, r * 1.7, fill, 0.28); // aura
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.2, x, y, r);
  g.addColorStop(0, shade(fill, 0.28)); g.addColorStop(0.6, fill); g.addColorStop(1, shade(fill, -0.4));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = shade(fill, -0.6); ctx.lineWidth = 1.4; ctx.stroke();
}
function bossEyes(x, y, dx, ey, er, glow) {
  ctx.shadowColor = glow; ctx.shadowBlur = 10; ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(x - dx, y + ey, er, 0, Math.PI * 2); ctx.arc(x + dx, y + ey, er, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = '#16121c';
  ctx.beginPath(); ctx.arc(x - dx, y + ey, er * 0.4, 0, Math.PI * 2); ctx.arc(x + dx, y + ey, er * 0.4, 0, Math.PI * 2); ctx.fill();
}

// drawn via drawDynamicBody (live, LAN ghosts, and the killcam use the same path)
function drawBossBody(b, now) {
  const { x, y } = b.position;
  const type = b.bossType;
  const r = b.circleRadius || 46;
  // canonical bosses render through the storybook toolkit; bespoke team bosses
  // (rizard, manu) keep their hand-crafted look below.
  if (type === 'dragon' || type === 'lich' || type === 'golem' || type === 'kraken') {
    drawStoryBoss(ctx, { x, y, r, type, color: b.color || '#e15d5d', now });
  } else if (type === 'rizard_rizz' || type === 'rizard_tizz') {
    const tizz = type === 'rizard_tizz';
    const c = tizz ? '#3fb5ff' : '#ffd166';
    if (tizz) runeRing(ctx, x, y, r + 16, '#3fb5ff', now, { count: 8, lw: 1.5, alpha: 0.6 }); // a locked-on targeting reticle — hyperfocus made visible
    bossOrb(x, y, r, c);
    // wizard hat (shaded, with a star tip — storybook)
    ctx.fillStyle = shade(c, -0.35);
    ctx.beginPath(); ctx.moveTo(x - 20, y - r + 4); ctx.lineTo(x + 20, y - r + 4); ctx.lineTo(x + 6, y - r - 30); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = shade(c, -0.6); ctx.lineWidth = 1.2; ctx.stroke();
    drawStar(ctx, x + 6, y - r - 28, 4, tizz ? '#dff4ff' : '#fff3b0');
    if (tizz) {
      // TIZZARD: hyperfocus & pattern mastery — steady glowing eyes, calm command.
      bossEyes(x, y, 11, -4, 5, '#eaffff');
      ctx.strokeStyle = '#16121c'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y + 6, 7, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); // calm, knowing half-smile
    } else {
      // RIZZARD: sunglasses + smirk (the charm)
      ctx.save(); ctx.translate(x, y - 4);
      ctx.fillStyle = '#16121c';
      ctx.fillRect(-20, -1.5, 40, 3);
      ctx.beginPath(); ctx.ellipse(-11, 0, 9, 6, 0, 0, Math.PI * 2); ctx.ellipse(11, 0, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.arc(-13, -2, 2, 0, Math.PI * 2); ctx.arc(9, -2, 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#16121c'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x + 2, y + 8, 8, 0.1 * Math.PI, 0.6 * Math.PI); ctx.stroke();
    }
  } else if (type === 'manu_de' || type === 'manu_mx') {
    const de = type === 'manu_de';
    const c = de ? '#c9cdd8' : '#e3a86a';
    bossOrb(x, y, r, c);
    bossEyes(x, y, 11, -6, 4, de ? '#dfe6ff' : '#fff0d0');
    // signature curly mustache
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 14, y + 8); ctx.quadraticCurveTo(x - 2, y + 14, x, y + 6); ctx.quadraticCurveTo(x + 2, y + 14, x + 14, y + 8); ctx.stroke();
    ctx.lineCap = 'butt';
    if (de) { // steel hat + red band + monocle
      ctx.fillStyle = '#4a4a5a'; ctx.beginPath(); ctx.moveTo(x - 20, y - r + 4); ctx.lineTo(x + 20, y - r + 4); ctx.lineTo(x, y - r - 30); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c0392b'; ctx.fillRect(x - 20, y - r + 1, 40, 5);
      ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + 11, y - 6, 8, 0, Math.PI * 2); ctx.stroke();
    } else { // sombrero
      ctx.fillStyle = '#8a5a2b';
      ctx.beginPath(); ctx.ellipse(x, y - r + 2, r + 22, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x, y - r - 8, 15, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#6cbf5b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y - r - 2, 15, 4, 0, 0, Math.PI * 2); ctx.stroke();
    }
  } else {
    drawStoryBoss(ctx, { x, y, r, type, color: b.color || '#e15d5d', now });
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
