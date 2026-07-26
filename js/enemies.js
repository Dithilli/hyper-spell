// enemies.js — PvE wave-survival mode. A new hostile entity family (label 'enemy')
// plus the wave manager and run lifecycle. Everything rides the existing summon /
// collision / explode / boss-AI plumbing, so enemies get physics, lava-culling and
// cleanup for free. Loaded after boss.js (uses bossAliveTarget/spawnBoss/summon)
// and before game.js, which calls updateEnemies/updateWaveMode/startRun/endRun.
//
// Wave mode is designed for couch play, but enemies DO ride the wire: spawnEnemy
// routes through summon(), and serializeSnapshot emits every summons body, so a LAN
// host broadcasts enemies to clients (they render as plain colored blobs client-side
// unless the ghost carries the type; the host draws them fully). What's genuinely
// couch-only is *starting* a wave run — there's no network start message, so the host
// begins one from its own keyboard (M then Space). This lets a spectator host render
// a networked Alinea fighting the waves.

const enemies = new Set();      // live enemy bodies (for wave-clear counting)
let pendingSpawns = [];         // staggered spawn queue: { type, tier, at, x, y }

// ---------- shared hostile attacks (mirror the boss helpers) ----------

// a projectile an archer/boss-add throws at a wizard. owner:'boss' is the
// hostile-to-players sentinel used across the game — full damage to any player,
// and (via explode's owner!=='boss' guard) it never hurts fellow enemies.
function enemyBolt(from, target, { speed = 9, r = 7, color = '#ff8c5a', spread = 0, boom = [55, 8, 10] } = {}) {
  const t = target.body.position;
  const a = Math.atan2(t.y - from.y, t.x - from.x) + spread;
  const fb = Bodies.circle(from.x + Math.cos(a) * 24, from.y + Math.sin(a) * 24, r, { density: 0.004, frictionAir: 0, label: 'projectile' });
  fb.owner = 'boss';
  fb.color = color;
  fb.gravityScale = 0.3;
  fb.expireAt = performance.now() + 5000;
  fb.onHit = self => explode(self.position.x, self.position.y, boom[0], boom[1], boom[2], 'boss');
  Body.setVelocity(fb, { x: Math.cos(a) * speed, y: Math.sin(a) * speed });
  projectiles.add(fb);
  Composite.add(world, fb);
  return fb;
}

// a melee swing: if a wizard is within reach, hit them once per the enemy's own
// cooldown (a swarm of 5 = 5 staggered swings, not one shared machine-gun).
function enemyStrike(b, e, now, reach = 34) {
  if (now < (b._touchAt || 0)) return;
  const t = bossAliveTarget(b.position);
  if (!t) return;
  const q = t.body.position;
  if (Math.abs(q.x - b.position.x) < reach && Math.abs(q.y - b.position.y) < 44) {
    b._touchAt = now + 700;
    damagePlayer(t, e.dmg);
    const away = Math.sign(q.x - b.position.x) || 1;
    Body.setVelocity(t.body, { x: away * 6, y: -5 });
    spawnParticles(q.x, q.y, e.color, 6, 4);
  }
}

// walk the body toward its nearest target; jump when the target is above and we're
// grounded. Returns the target (or null) so callers can layer ranged behavior.
function enemyChase(b, now, { speed = 1.1, jump = true } = {}) {
  const t = bossAliveTarget(b.position);
  if (!t) return null;
  const dir = Math.sign(t.body.position.x - b.position.x) || 1;
  Body.setVelocity(b, { x: b.velocity.x * 0.8 + dir * speed, y: b.velocity.y });
  const grounded = Math.abs(b.velocity.y) < 1;
  if (jump && grounded && t.body.position.y < b.position.y - 60 && now > (b._jumpAt || 0)) {
    b._jumpAt = now + 900;
    Body.setVelocity(b, { x: b.velocity.x, y: -11 });
  }
  return t;
}

// ---------- enemy roster ----------

const ENEMY_TYPES = {
  // grunt: marches in and swings a blade
  swordsman: {
    color: '#5b5470', hp: 40, dmg: 12,
    make(x, y) { return Bodies.rectangle(x, y, 26, 44, { density: 0.012, friction: 0.6, frictionAir: 0.02, restitution: 0, label: 'enemy', chamfer: { radius: 6 } }); },
    ai(e, b, now) { enemyChase(b, now, { speed: 1.15 }); enemyStrike(b, e, now, 36); },
  },
  // ranged: hangs back and fires bolts, backpedals when crowded
  archer: {
    color: '#8fce7a', hp: 28, dmg: 9,
    make(x, y) { return Bodies.rectangle(x, y, 24, 42, { density: 0.01, friction: 0.6, frictionAir: 0.03, restitution: 0, label: 'enemy', chamfer: { radius: 6 } }); },
    ai(e, b, now) {
      const t = bossAliveTarget(b.position);
      if (!t) return;
      const d = Math.hypot(t.body.position.x - b.position.x, t.body.position.y - b.position.y);
      const dir = Math.sign(t.body.position.x - b.position.x) || 1;
      // hold a mid range: close in from afar, back off when too close
      const move = d > 360 ? dir : d < 200 ? -dir : 0;
      Body.setVelocity(b, { x: b.velocity.x * 0.82 + move * 1.0, y: b.velocity.y });
      if (now > (b._fireAt || (b._fireAt = now + 900))) {
        b._fireAt = now + rand(1400, 2100);
        enemyBolt(b.position, t, { speed: 10, r: 6, color: '#8fce7a', boom: [50, 7, e.dmg] });
        sfx.cast?.();
      }
    },
  },
  // swarm: small, fast, hops straight at the nearest wizard
  bug: {
    color: '#b57edc', hp: 14, dmg: 7,
    make(x, y) { return Bodies.circle(x, y, 12, { density: 0.004, friction: 0.4, frictionAir: 0.01, restitution: 0.5, label: 'enemy' }); },
    ai(e, b, now) {
      const t = bossAliveTarget(b.position);
      if (!t) return;
      const dir = Math.sign(t.body.position.x - b.position.x) || 1;
      if (Math.abs(b.velocity.y) < 1 && now > (b._hopAt || 0)) {
        b._hopAt = now + rand(320, 560);
        Body.setVelocity(b, { x: dir * rand(3, 5.5), y: -7 });
      }
      enemyStrike(b, e, now, 20);
    },
  },
  // heavy: slow, tanky, leaps and slams the ground for an AoE shock
  ogre: {
    color: '#c98a4a', hp: 120, dmg: 20,
    make(x, y) { return Bodies.rectangle(x, y, 54, 70, { density: 0.03, friction: 0.8, frictionAir: 0.02, restitution: 0, label: 'enemy', chamfer: { radius: 8 } }); },
    ai(e, b, now) {
      const t = enemyChase(b, now, { speed: 0.7, jump: false });
      if (!t) return;
      if (now > (b._leapAt || (b._leapAt = now + 2500)) && Math.abs(b.velocity.y) < 1) {
        b._leapAt = now + rand(4000, 6000);
        b._airborne = true;
        const dir = Math.sign(t.body.position.x - b.position.x) || 1;
        Body.setVelocity(b, { x: dir * rand(4, 7), y: -14 });
        sfx.boing?.();
      }
      if (b._airborne && b.velocity.y >= 0 && Math.abs(b.velocity.y) < 0.8) {
        b._airborne = false;
        explode(b.position.x, b.position.y + 24, 110, 14, e.dmg, 'boss');
        addShake(10);
      }
      enemyStrike(b, e, now, 44);
    },
  },
};

// ---------- spawn / damage / update ----------

function spawnEnemy(type, x, y, tier = 1) {
  const def = ENEMY_TYPES[type];
  if (!def) return null;
  const b = def.make(x, y);
  b.label = 'enemy';
  // humanoids stay on their feet (bugs are free to tumble) — infinite rotational
  // inertia stops rectangles from toppling over on every bump, like the golem does
  if (type !== 'bug') { Body.setInertia(b, Infinity); Body.setAngle(b, 0); }
  const hp = Math.round(def.hp * (1 + 0.35 * (tier - 1)));
  const e = { type, tier, color: def.color, hp, maxHp: hp, dmg: def.dmg * (1 + 0.25 * (tier - 1)), hurtAt: 0, body: b };
  b.enemy = e;
  enemies.add(b);
  summon(b, { life: 1e12, color: def.color }); // adds to world + summons (cleanup/lava-cull for free)
  return e;
}

function damageEnemy(e, dmg, at, src) {
  if (!e || e.hp <= 0) return;
  e.hp -= dmg;
  e.hurtAt = performance.now();
  if (at) spawnParticles(at.x, at.y, e.color, 6, 4);
  if (e.hp <= 0) killEnemy(e, src);
}

function killEnemy(e, src) {
  const b = e.body;
  if (!enemies.has(b)) return;
  enemies.delete(b);
  spawnParticles(b.position.x, b.position.y, e.color, 18, 8, 40);
  spawnRing(b.position.x, b.position.y, e.color);
  removeSummon(b); // out of summons + world
  sfx.death?.();
}

function clearEnemies() {
  for (const b of [...enemies]) removeSummon(b);
  enemies.clear();
  pendingSpawns = [];
}

function updateEnemies(now, dt) {
  if (game.state !== 'PLAY') return;
  for (const b of [...enemies]) {
    // reconcile with summons: postPhysics may have culled a body that fell off the
    // map / into lava — treat that as cleared so the wave counter stays honest.
    if (!summons.has(b)) { enemies.delete(b); continue; }
    const e = b.enemy;
    if (!e || e.hp <= 0) { enemies.delete(b); continue; }
    ENEMY_TYPES[e.type].ai(e, b, now, dt);
  }
}

// ---------- wave manager ----------

const WAVE_ENEMY_CAP = 20; // couch-sane concurrent cap; overflow is logged, not silent

// difficulty tier climbs every 5 waves (also what boss capstones scale by)
function waveTier(n) { return 1 + Math.floor((n - 1) / 5); }

// a flat list of enemy type strings for wave n (non-boss waves)
function waveComposition(n) {
  const list = [];
  for (let i = 0; i < 2 + Math.floor(n * 0.8); i++) list.push('swordsman');
  if (n >= 3) for (let i = 0; i < 1 + Math.floor(n / 4); i++) list.push('archer');
  if (n >= 4) for (let i = 0; i < 3 + Math.floor(n / 2); i++) list.push('bug');
  if (n >= 6) for (let i = 0; i < Math.floor((n - 4) / 3); i++) list.push('ogre');
  if (list.length > WAVE_ENEMY_CAP) {
    console.warn(`wave ${n}: capping ${list.length} enemies to ${WAVE_ENEMY_CAP}`);
    return list.slice(0, WAVE_ENEMY_CAP);
  }
  return list;
}

function queueSpawn(type, tier, at) {
  const side = Math.random() < 0.5 ? -1 : 1;
  pendingSpawns.push({ type, tier, at, x: side < 0 ? 40 : W - 40, y: 120 });
}

function startWave(n) {
  game.wave = n;
  game.waveState = 'active';
  const now = performance.now();
  const tier = waveTier(n);
  if (n % 5 === 0) {
    // boss capstone (+ a few adds), reusing the scaled boss system
    game.fightAt = now; // let the boss announce right after the wave banner
    spawnBoss(now, { tier });
    const adds = Math.min(4, 1 + Math.floor(n / 10));
    for (let i = 0; i < adds; i++) queueSpawn('swordsman', tier, now + 500 + i * 500);
    setBanner(`WAVE ${n} — BOSS`, '#ffd166', 1600);
  } else {
    let t = now + 300;
    for (const type of waveComposition(n)) { queueSpawn(type, tier, t); t += rand(160, 340); }
    setBanner(`WAVE ${n}`, '#e8d5ff', 1200);
  }
  sfx.roundWin?.();
}

function updateWaveMode(now) {
  if (game.mode !== 'wave' || game.state !== 'PLAY') return;
  // flush the staggered spawn queue
  if (pendingSpawns.length) {
    pendingSpawns = pendingSpawns.filter(s => {
      if (now < s.at) return true;
      spawnEnemy(s.type, s.x, s.y, s.tier);
      return false;
    });
  }
  if (game.waveState === 'active') {
    if (!pendingSpawns.length && enemies.size === 0 && !game.boss) {
      game.waveState = 'intermission';
      game.intermissionAt = now + 3200;
      for (const p of players) if (!p.alive) spawnPlayer(p, spawnPointFor(p)); // revive the fallen
      spawnTome(now); spawnTome(now); // reward: a couple of tomes to power up
      setBanner(`WAVE ${game.wave} CLEARED`, '#7bd88f', 1600);
      sfx.victory?.();
    }
  } else if (game.waveState === 'intermission' && now > game.intermissionAt) {
    startWave(game.wave + 1);
  }
}

// ---------- run lifecycle ----------

function startRun() {
  game.mode = 'wave';
  clearReplay();
  resetMatchStats();
  resetMatchTelemetry();
  game.totalRounds = 0;
  game.wave = 0;
  game.winner = null;
  game.boss = null;
  clearEnemies();
  // a grounded, non-cozy arena to fight in
  const idx = MAPS.findIndex(m => !m.cozy && (m.gravity ?? 2) > 0);
  loadMap(idx >= 0 ? idx : 0);
  for (const p of players) { clearSpells(p); despawnPlayer(p); spawnPlayer(p, spawnPointFor(p)); }
  dealStartingSpells();
  game.state = 'PLAY';
  game.fightAt = performance.now() + 900;
  game.fightShown = false;
  game.bestWave = +(localStorage.getItem('hs-best-wave') || 0);
  scheduleTomes(performance.now());
  startWave(1);
}

function endRun() {
  const reached = game.wave;
  game.runScore = reached;
  if (reached > (game.bestWave || 0)) { game.bestWave = reached; localStorage.setItem('hs-best-wave', String(reached)); }
  game.state = 'RUN_OVER';
  game.winner = null;
  clearEnemies();
  game.boss = null;
  setBanner(`OVERRUN — REACHED WAVE ${reached}`, '#ff6b6b', 2400);
  sfx.death?.();
  slowMo(0.3, 1000);
}
